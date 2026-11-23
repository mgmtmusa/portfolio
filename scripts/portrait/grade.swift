import Foundation
import simd
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

// usage: grade <photo> <mask> <outPNG> <mode: frame|cut> [preview.png]
let a = CommandLine.arguments
func load(_ p: String) -> CGImage { let s = CGImageSourceCreateWithURL(URL(fileURLWithPath: p) as CFURL, nil)!; return CGImageSourceCreateImageAtIndex(s, 0, nil)! }
func rgba(_ img: CGImage) -> [UInt8] {
  let w = img.width, h = img.height
  var buf = [UInt8](repeating: 0, count: w*h*4)
  let ctx = CGContext(data: &buf, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w*4, space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
  ctx.draw(img, in: CGRect(x: 0, y: 0, width: w, height: h)); return buf
}
let photo = load(a[1]), maskImg = load(a[2]); let mode = a[4]
let W = photo.width, H = photo.height
let P = rgba(photo), M = rgba(maskImg)
var alpha = [Float](repeating: 0, count: W*H)
for i in 0..<W*H { alpha[i] = Float(M[i*4]) / 255 }
// close small holes in the lower body (buttons): any pixel below y=0.62H that is enclosed horizontally by mask gets filled
for y in Int(Double(H)*0.62)..<H {
  var l = -1, r = -1
  for x in 0..<W where alpha[y*W+x] > 0.5 { if l < 0 { l = x }; r = x }
  if l >= 0 { for x in l...r { alpha[y*W+x] = max(alpha[y*W+x], 1) } }
}
// erode 2px then soften 1px: the outer two pixels carry the grey backdrop
do {
  var er = alpha
  let R = 2
  for y in 0..<H { for x in 0..<W { var m: Float = 1
    for dy in -R...R { let yy = min(max(y+dy,0),H-1); for dx in -R...R { let xx = min(max(x+dx,0),W-1); m = min(m, alpha[yy*W+xx]) } }
    er[y*W+x] = m } }
  var bl = er
  for y in 0..<H { for x in 0..<W { var s: Float = 0
    for dy in -1...1 { let yy = min(max(y+dy,0),H-1); for dx in -1...1 { let xx = min(max(x+dx,0),W-1); s += er[yy*W+xx] } }
    bl[y*W+x] = s/9 } }
  alpha = bl
}
// estimate backdrop colour per row from pixels with alpha == 0
var bg = [SIMD3<Float>](repeating: .zero, count: H)
for y in 0..<H { var s = SIMD3<Float>(0,0,0); var n: Float = 0
  for x in 0..<W where alpha[y*W+x] < 0.01 { let i=(y*W+x)*4; s += SIMD3(Float(P[i]),Float(P[i+1]),Float(P[i+2]))/255; n += 1 }
  bg[y] = n > 20 ? s/n : (y > 0 ? bg[y-1] : SIMD3(0.9,0.9,0.9)) }
let page = SIMD3<Float>(18,17,16)/255
func smooth(_ e0: Float, _ e1: Float, _ x: Float) -> Float { let t = min(max((x-e0)/(e1-e0),0),1); return t*t*(3-2*t) }
var out = [UInt8](repeating: 0, count: W*H*4)
var prev = [UInt8](repeating: 0, count: W*H*4)
var rng = SystemRandomNumberGenerator()
for y in 0..<H { for x in 0..<W {
  let i = y*W+x, j = i*4
  var c = SIMD3(Float(P[j]),Float(P[j+1]),Float(P[j+2]))/255
  let al = alpha[i]
  // decontaminate edge pixels from the light backdrop
  if al > 0.02 && al < 0.999 { let b = bg[y]; c = (c - (1-al)*b) / max(al, 0.15); c = simd_clamp(c, SIMD3<Float>(0,0,0), SIMD3<Float>(1,1,1)) }
  // ---- grade (whole subject) ----
  c *= 0.90                                         // exposure
  c = SIMD3(pow(c.x,1.06), pow(c.y,1.06), pow(c.z,1.06)) // deepen mids
  // highlight roll-off so the white shirt sits below the page text
  for k in 0..<3 { let v = c[k]; if v > 0.62 { c[k] = 0.62 + (v-0.62)*0.55 } }
  c = 0.032 + (1-0.032)*c                           // lifted blacks
  c *= SIMD3(1.05, 1.0, 0.90)                      // warmth (red above blue)
  // key light high on the left: luminance falloff, no colour
  let fx = Float(x)/Float(W), fy = Float(y)/Float(H)
  let d2 = (fx-0.36)*(fx-0.36) + (fy-0.20)*(fy-0.20)*0.8
  let key = 0.74 + 0.36*exp(-d2/0.16)
  c *= key
  // ---- composite ----
  var oa: Float
  // backdrop: warm dark pool, lit from the same side
  let pool = page + SIMD3<Float>(16,13,9)/255 * exp(-((fx-0.26)*(fx-0.26)+(fy-0.16)*(fy-0.16))/0.10)
  // bottom dissolve: body fades into the page over the lowest 24%
  let bottom = 1 - smooth(0.74, 1.0, fy)
  // lower-corner dissolve so the frame edge never shows
  let side = 1 - smooth(0.80, 1.0, max(abs(fx-0.5)*2 - 0.0, 0)) * smooth(0.55, 0.9, fy)
  if mode == "cut" {
    oa = al * bottom * side
  } else {
    // framed: backdrop kept as part of the photo, falling to transparent at the frame edge
    let ex = min(fx, 1-fx), ey = min(fy, 1-fy)
    let edge = smooth(0.0, 0.22, min(ex, ey*1.2))
    let bgA = edge * 0.92
    c = al*c + (1-al)*pool
    oa = max(al, bgA) * bottom * side
    if al < 0.5 { oa = bgA * bottom * side + al * bottom * side }
    oa = min(oa, 1)
  }
  // dither ±0.5 LSB against banding
  let dz = Float(Int.random(in: -1...1, using: &rng)) * 0.5 / 255
  c += SIMD3(dz,dz,dz)
  c = simd_clamp(c, SIMD3<Float>(0,0,0), SIMD3<Float>(1,1,1))
  out[j] = UInt8(c.x*oa*255); out[j+1] = UInt8(c.y*oa*255); out[j+2] = UInt8(c.z*oa*255); out[j+3] = UInt8(oa*255)
  // preview on page colour
  let pv = c*oa + page*(1-oa)
  prev[j] = UInt8(pv.x*255); prev[j+1] = UInt8(pv.y*255); prev[j+2] = UInt8(pv.z*255); prev[j+3] = 255
}}
func save(_ buf: [UInt8], _ path: String) {
  var b = buf
  let ctx = CGContext(data: &b, width: W, height: H, bitsPerComponent: 8, bytesPerRow: W*4, space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
  let img = ctx.makeImage()!
  let d = CGImageDestinationCreateWithURL(URL(fileURLWithPath: path) as CFURL, UTType.png.identifier as CFString, 1, nil)!
  CGImageDestinationAddImage(d, img, nil); CGImageDestinationFinalize(d)
}
save(out, a[3]); if a.count > 5 { save(prev, a[5]) }
print("ok", W, H, mode)

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
let env = ProcessInfo.processInfo.environment
func ef(_ k: String, _ d: Float) -> Float { Float(env[k] ?? "") ?? d }
// Direction parameters (defaults = the A "Cover" grade)
let poolRGB = SIMD3<Float>(ef("POOL_R", 16), ef("POOL_G", 13), ef("POOL_B", 9)) / 255
let poolX = ef("POOL_X", 0.26), poolY = ef("POOL_Y", 0.16), poolS = ef("POOL_S", 0.10)
let keyLow = ef("KEY_LOW", 0.74)
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
  let R = Int(ProcessInfo.processInfo.environment["ERODE"] ?? "2") ?? 2
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
// Edge colour: in the transition band (and 3px outside it) use the mean colour of nearby fully opaque
// subject pixels, so no grey from the old backdrop survives as a light fringe.
var bandF = [SIMD3<Float>?](repeating: nil, count: W*H)
do {
  // "deep" = at least 2px inside the matte; the outer 2px of the subject still carry backdrop grey
  var deep = alpha
  for _ in 0..<2 {
    var nx = deep
    for y in 0..<H { for x in 0..<W { var m = deep[y*W+x]
      if x > 0 { m = min(m, deep[y*W+x-1]) }; if x < W-1 { m = min(m, deep[y*W+x+1]) }
      if y > 0 { m = min(m, deep[(y-1)*W+x]) }; if y < H-1 { m = min(m, deep[(y+1)*W+x]) }
      nx[y*W+x] = m } }
    deep = nx
  }
  var near = [Bool](repeating: false, count: W*H)
  for y in 0..<H { for x in 0..<W where alpha[y*W+x] > 0.02 && deep[y*W+x] < 0.98 {
    for dy in -3...3 { let yy = y+dy; if yy < 0 || yy >= H { continue }
      for dx in -3...3 { let xx = x+dx; if xx < 0 || xx >= W { continue }; near[yy*W+xx] = true } } } }
  let Rr = 7
  for y in 0..<H { for x in 0..<W where near[y*W+x] && deep[y*W+x] < 0.98 {
    // the base tone, not the sheen: mean of the darkest quarter of nearby deep pixels
    var cs: [SIMD3<Float>] = []
    for dy in -Rr...Rr { let yy = y+dy; if yy < 0 || yy >= H { continue }
      for dx in -Rr...Rr { let xx = x+dx; if xx < 0 || xx >= W { continue }
        let j = yy*W+xx; if deep[j] >= 0.98 { let k = j*4; cs.append(SIMD3(Float(P[k]),Float(P[k+1]),Float(P[k+2]))/255) } } }
    if cs.isEmpty { continue }
    cs.sort { ($0.x*0.2126 + $0.y*0.7152 + $0.z*0.0722) < ($1.x*0.2126 + $1.y*0.7152 + $1.z*0.0722) }
    let half = cs.prefix(max(1, cs.count / 4))
    bandF[y*W+x] = half.reduce(SIMD3<Float>(0,0,0), +) / Float(half.count) } }
}
// Fallback edge colour where no deep pixel is in reach (thin strands): the hair's base tone.
var hairBase = SIMD3<Float>(0.09, 0.085, 0.08)
do { var s3 = SIMD3<Float>(0,0,0); var n: Float = 0
  for y in Int(Float(H)*0.08)..<Int(Float(H)*0.30) { for x in 0..<W where alpha[y*W+x] >= 0.98 {
    let k = (y*W+x)*4; let c = SIMD3(Float(P[k]),Float(P[k+1]),Float(P[k+2]))/255
    if c.x*0.2126 + c.y*0.7152 + c.z*0.0722 < 0.15 { s3 += c; n += 1 } } }
  if n > 0 { hairBase = s3 / n } }
// 4×4 ordered dither, ±1 level, where the matte is below .05 (the pool and the dissolve)
let bayer: [Float] = [0,8,2,10, 12,4,14,6, 3,11,1,9, 15,7,13,5].map { ($0 / 15 - 0.5) * 2 / 255 }
func smooth(_ e0: Float, _ e1: Float, _ x: Float) -> Float { let t = min(max((x-e0)/(e1-e0),0),1); return t*t*(3-2*t) }
var out = [UInt8](repeating: 0, count: W*H*4)
var prev = [UInt8](repeating: 0, count: W*H*4)
var rng = SystemRandomNumberGenerator()
for y in 0..<H { for x in 0..<W {
  let i = y*W+x, j = i*4
  var c = SIMD3(Float(P[j]),Float(P[j+1]),Float(P[j+2]))/255
  let al = alpha[i]
  // decontaminate edge pixels from the light backdrop
  if let f = bandF[i] { c = f }
  else if al > 0.02 && al < 0.98 { c = min(c, hairBase * 1.6) ; c = (c + hairBase) / 2 }
  else if al > 0.02 && al < 0.999 { let b = bg[y]; c = (c - (1-al)*b) / max(al, 0.15); c = simd_clamp(c, SIMD3<Float>(0,0,0), SIMD3<Float>(1,1,1)) }
  // ---- grade (whole subject) ----
  c *= 0.90                                         // exposure
  c = SIMD3(pow(c.x,1.06), pow(c.y,1.06), pow(c.z,1.06)) // deepen mids
  // highlight roll-off so the white shirt sits below the page text
  let hiT = ef("HI_T", 0.62), hiS = ef("HI_S", 0.55)
  for k in 0..<3 { let v = c[k]; if v > hiT { c[k] = hiT + (v-hiT)*hiS } }
    // warmth (red above blue), eased off in the highlights so the shirt reads white, not cream
  let lum0 = c.x*0.2126 + c.y*0.7152 + c.z*0.0722
  let hw = smooth(0.55, 0.85, lum0)
  c *= SIMD3<Float>(1.05, 1.0, 0.90) + (SIMD3<Float>(1.02, 1.0, 0.965) - SIMD3<Float>(1.05, 1.0, 0.90)) * hw
  // navy reads as ink, never blue: pull blue-dominant pixels 35% toward their luminance
  let lum = c.x*0.2126 + c.y*0.7152 + c.z*0.0722
  let blueness = min(max((c.z - c.x) * 4, 0), 1)
  c = c + (SIMD3<Float>(lum, lum, lum) - c) * (0.35 * blueness)
  // key light high on the left: luminance falloff, no colour
  let fx = Float(x)/Float(W), fy = Float(y)/Float(H)
  let d2 = (fx-0.36)*(fx-0.36) + (fy-0.20)*(fy-0.20)*0.8
  let key = keyLow + (1.10 - keyLow)*exp(-d2/0.16)
  c *= key
  c = page + (SIMD3<Float>(1,1,1) - page) * c     // black lands exactly on the page colour
  do { let L = (c.x*0.2126 + c.y*0.7152 + c.z*0.0722) * 255; let w = 1 - smooth(40, 60, L)
       c += SIMD3<Float>(2, 0, -3) / 255 * w
       if c.y < c.z { c.y = (c.y + c.z) / 2; c.z = c.y } ; if c.x < c.y { c.x = c.y } }
  // ---- composite ----
  var oa: Float
  // backdrop: warm dark pool, lit from the same side
  let pool = page + poolRGB * exp(-((fx-poolX)*(fx-poolX)+(fy-poolY)*(fy-poolY))/poolS)
  // bottom dissolve: body fades into the page over the lowest 24%
  let bottom = 1 - smooth(0.74, 1.0, fy)
  // lower-corner dissolve so the frame edge never shows
  let side = 1 - smooth(0.80, 1.0, max(abs(fx-0.5)*2 - 0.0, 0)) * smooth(0.55, 0.9, fy)
  if mode == "photo" {
    c = al*c + (1-al)*pool
    // radial-gradient(62% 60% at 47% 40%, #000 60%, transparent 100%) plus a bottom fade 80 to 100%
    let ex = (fx-0.485)/0.605, ey = (fy-0.40)/0.60
    let rr = (ex*ex + ey*ey).squareRoot()
    let radial = 1 - smooth(0.60, 1.0, rr)
    let foot = 1 - smooth(0.80, 1.0, fy)
    let top = smooth(0, 80.0/Float(H), fy)
    let sides = smooth(0, 0.035, fx) * smooth(0, 0.035, 1-fx)
    oa = max(0, min(1, radial * foot * top * sides))
  } else if mode == "cut" {
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
  if al < 0.05 { let d = bayer[(y % 4) * 4 + (x % 4)]; c += SIMD3(d, d, d); oa = max(0, min(1, oa + d * (oa > 0 && oa < 1 ? 1 : 0))) }
  c = simd_clamp(c, page, SIMD3<Float>(1,1,1))      // nothing darker than the page
  out[j] = UInt8((c.x*oa*255).rounded()); out[j+1] = UInt8((c.y*oa*255).rounded()); out[j+2] = UInt8((c.z*oa*255).rounded()); out[j+3] = UInt8((oa*255).rounded())
  // preview on page colour
  let pv = c*oa + page*(1-oa)
  prev[j] = UInt8((pv.x*255).rounded()); prev[j+1] = UInt8((pv.y*255).rounded()); prev[j+2] = UInt8((pv.z*255).rounded()); prev[j+3] = 255
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

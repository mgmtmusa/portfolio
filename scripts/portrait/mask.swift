import Foundation
import Vision
import CoreImage
import AppKit

let args = CommandLine.arguments
let input = URL(fileURLWithPath: args[1])
let outPerson = URL(fileURLWithPath: args[2])
let ctx = CIContext()
guard let ci = CIImage(contentsOf: input) else { fatalError("no image") }
let handler = VNImageRequestHandler(ciImage: ci, options: [:])

func write(_ buf: CVPixelBuffer, _ url: URL) {
  var m = CIImage(cvPixelBuffer: buf)
  let sx = ci.extent.width / m.extent.width, sy = ci.extent.height / m.extent.height
  m = m.transformed(by: CGAffineTransform(scaleX: sx, y: sy))
  let cs = CGColorSpaceCreateDeviceGray()
  try! ctx.writePNGRepresentation(of: m, to: url, format: .L8, colorSpace: cs)
  print("wrote", url.path, m.extent)
}

let p = VNGeneratePersonSegmentationRequest()
p.qualityLevel = .accurate
p.outputPixelFormat = kCVPixelFormatType_OneComponent8
try handler.perform([p])
if let r = p.results?.first { write(r.pixelBuffer, outPerson) }

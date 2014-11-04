import Foundation

let 💩 = (
    [0x64, 0x0a, 0x73, 0x61, 0x69, 0x73, 0x20, 0x6c, 0x76, 0x70, 0x6e, 0x69, 0x61] as [Byte],
    [6, 12, 11, 3, 5, 10, 7, 4, 2, 8, 1, 0, 9]
)
let 🙅 = (
    [0x77, 0x6e, 0x6f, 0x72, 0x0a, 0x67] as [Byte],
    [0, 3, 2, 1, 5, 4]
)
let 👍 = (
    [0xad, 0xa1, 0xac, 0xb2, 0xdd, 0xd3] as [Byte],
    [5, 2, 1, 4, 3, 0]
)

func 👄(data : [Byte], idx : [Int]) {
    var arr : [Byte] = [Byte](count: idx.count, repeatedValue: 0)
    for i in 0..<(idx.count) {
        arr[idx[i]] = data[i]
    }
    for v in arr {
        print(Character(UnicodeScalar(v)))
    }
}

func 🙎(pass : String) {
    let passData = pass.dataUsingEncoding(NSASCIIStringEncoding)!
    var key = 204 as Byte
    var p : [Byte] = []
    for i in (0..<(👍.0.count)) {
        let val = (👍.0[i] ^ key) & (0xff)
        p.append(val)
        key = (key + ~👍.1[i]) & 0xff
    }
    if passData.length != p.count {
        👄(🙅)
        exit(EXIT_FAILURE)
    }
    for i in 0..<(p.count) {
        if passData.arrayOfBytes()[👍.1[i]] != p[i] {
            👄(🙅)
            exit(EXIT_FAILURE)
        }
    }
    // println("pass ok")
}

func 🔞(pass : String) {
    🙎(pass)
    
    let cred = pass
    let credData = cred.dataUsingEncoding(NSASCIIStringEncoding)!
    let credHash = Hash.calculate(Hash.sha256)(credData)
    var key : [Byte] = []
    var iv : [Byte] = []
    for var i = 0; i < credHash.length; ++i {
        key.append(credHash.arrayOfBytes()[i])
        iv.append(credHash.arrayOfBytes()[++i])
    }
    key += key.reverse()
    let keyData = NSData(bytes: key, length: key.count)
    let ivData = NSData(bytes: iv, length: iv.count)
    
    let text : [Byte] = [
        0x7f, 0x97, 0x45, 0x20, 0xab, 0x20, 0x78, 0x42, 0x80, 0xcb,
        0x7f, 0x6a, 0x49, 0x5d, 0xbd, 0x6d, 0x6d, 0xa1, 0xbb, 0xd1,
        0xc4, 0xe5, 0x43, 0xbd, 0x9b, 0x82, 0x1b, 0x46, 0x97, 0x26,
        0x4a, 0xb6, 0x9b, 0xa4, 0x6b, 0xf3, 0x56, 0x9f, 0x5b, 0xa4,
        0x5f, 0xfe, 0x3c, 0x20, 0x54, 0x0f, 0x29, 0x9f, 0xdb, 0xe8,
        0x2c, 0xd3, 0x17, 0x14, 0xbf, 0xd6, 0xe4, 0x7e, 0x4f, 0x80,
        0x7f, 0xf1, 0x8e, 0x99, 0xe6, 0xaf, 0xcd, 0x99, 0x79, 0x38,
        0xd4, 0x4f, 0x07, 0xc9, 0x58, 0xa1, 0x6a, 0x77, 0x00, 0x19,
        0x5d, 0x67, 0xa1, 0x7e, 0x2c, 0x5b, 0x3b, 0x53, 0xef, 0x4f,
        0x4a, 0xe2, 0x58, 0x01, 0x1f, 0x67, 0x88, 0x35, 0xba, 0x4d,
        0x8f, 0x26, 0xec, 0x0e, 0x55, 0x3e, 0x27, 0x4f, 0x60, 0x41,
        0xf4, 0x25, 0x49, 0x89, 0xad, 0x8a, 0x89, 0x33, 0x72, 0x4e,
        0x2b, 0xcb, 0x1f, 0xd3, 0x0c, 0x27, 0xce, 0xfb, 0xed, 0x25,
        0x56, 0x27, 0x6e, 0xa5, 0xbe, 0x85, 0x6e, 0x8f, 0x7b, 0x30,
        0x7c, 0xde, 0xd7, 0x14, 0x42, 0x43, 0x59, 0x1e, 0x3d, 0x1c,
        0x46, 0x8b, 0xe6, 0x6e, 0x91, 0xbb, 0xcd, 0x06, 0x0f, 0xbc,
        0x25, 0x91, 0xd6, 0x98, 0xd9, 0x6f, 0xea, 0x6e, 0xc9, 0x3b,
        0xbb, 0x12, 0xa1
    ]
    let textData = NSData(bytes: text, length: text.count)
    let cipher = ChaCha20(key: keyData, iv: ivData)
    //let enc = cipher.encrypt(textData)
    let dec = cipher.decrypt(textData)
    //println(", ".join(enc.arrayOfBytes().map({ b in NSString(format: "0x%02x", b) as String })))
    println("".join(dec.arrayOfBytes().map{ b in String(UnicodeScalar(b)) }))
}

if Process.arguments.count < 2 {
    println("\(Process.arguments[0]) [password]")
    exit(EXIT_SUCCESS)
}
🔞(Process.arguments[1])
// 🔞("k0gasa")
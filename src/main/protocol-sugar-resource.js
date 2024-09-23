import { is } from '@electron-toolkit/utils'
import { app, protocol } from 'electron'
import fs from 'fs'
import path from 'path'
/** 资源文件存档 */
const ARCHIVE_PAK_NAME = 'RESOURCE.PAK'
/** 协议名称 */
const PROTOCOL_NAME = 'sugar'

/**
 * 这里可以通过部分操作实现加密解密
 * @param {string} archivePath
 */
function GetArchiveFileMate(archivePath) {
  // 之前预留的4MB空间
  const bufferSize = 1024 * 1024 * 4
  const fd = fs.openSync(archivePath, 'r')
  const contentBase64Bufer = Buffer.alloc(bufferSize)
  fs.readSync(fd, contentBase64Bufer, 0, bufferSize, 0)
  const contentBufer = Buffer.from(contentBase64Bufer.toString(), 'base64')
  return JSON.parse(contentBufer.toString())
}

/**
 * 获取存档文件所处根目录
 * 注意：开发环境与生产环境路径
 * @returns
 */
function GetArchiveRootPath() {
  if (is.dev) {
    return path.resolve(__dirname, '..', '..', 'archive')
  }
  return path.resolve(path.parse(app.getPath('exe')).dir, 'resources')
}

/**
 * 对字节缓存块解密
 * @param {Buffer} chunk
 * @param {Buffer|string} secret
 */
function ANY_DECRYPT(chunk, secret) {
  // do somethin
  return chunk
}

/**
 * 将自定义资源协议注册至程序内，
 * 确保该函数调用时，`app`处于`Ready`状态后
 */
export function InstallSugarResourceProtocol() {
  const ArchivePath = path.resolve(GetArchiveRootPath(), ARCHIVE_PAK_NAME)
  if (!fs.existsSync(ArchivePath)) {
    throw new Error(`${ArchivePath} Is Not Found!!`)
  }
  const ArchiveFileMate = GetArchiveFileMate(ArchivePath)

  /**
   * 这里的`protocol.handle`根据`electron`版本实现方式会存在差别，需注意
   */
  protocol.handle(
    PROTOCOL_NAME,
    /**
     * @param { Request} request
     */
    (request) => {
      const uri = request.url.slice(`${PROTOCOL_NAME}://`.length)
      const paths = uri.split('/') 
      let leafMate = ArchiveFileMate
      for (const p of paths) {
        leafMate = leafMate[p]
        if (leafMate === undefined) {
          break
        }
      }
      if (leafMate === undefined || !('size' in leafMate)) {
        // 文件不存在，返回404码
        const res = new Response(new Blob(), {
          status: 404,
          statusText: 'File Not Found'
        })
        return res
      }
      const readPosition = leafMate.readPosition
      const size = leafMate.size
      
      /**
       * 这里可以通过读取secret，对文件buffer进行解密后返回
       */
      const secret = leafMate.secret
      const fileReader = fs.createReadStream(ArchivePath, {
        flags: 'r+',
        start: readPosition,
        end: readPosition + size
      })

      const stream = new ReadableStream({
        start(ctroller) {
          return new Promise((resovle) => {
            fileReader.on('readable', () => {
              /** @type {Buffer} */
              let chunk
              /** 根据需要修改每次读取缓存块大小 */
              while (null !== (chunk = fileReader.read(1024))) {
                ANY_DECRYPT(chunk, secret)
                ctroller.enqueue(chunk)
              }
              resovle()
            })
            fileReader.on('end', () => {
              ctroller.close()
              fileReader.close()
            })
          })
        }
      })
      return new Response(stream);
    }
  )
}

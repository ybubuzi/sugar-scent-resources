import fs from 'fs'
import path from 'path'
import { createHash, createCipheriv } from 'crypto'

/** 归档资源文件最终存放文件夹路径 */
const BASE_ROOT_DIR = 'archive'
/** 最终归档的文件名称 */
const BASE_ARCH_NAME = 'RESOURCE.PAK'

/**
 * 深度创建文件夹
 * 等效`mkdir -p [path]`
 * @param {string} path 目标路径
 * @returns {string} 最终创建的目录
 */
async function DeepMkdir(dirPath) {
  if (!dirPath) {
    throw 'The dirPath argument is required when calling the DeepMkdir function'
  }
  return new Promise((resolve, reject) => {
    fs.mkdir(dirPath, { recursive: true }, (err, finalPath) => {
      if (err) {
        return reject(err)
      }
      resolve(finalPath)
    })
  })
}

/**
 * 判断目标路径文件是否存在
 * @param {*} path 目标路径
 * @return { boolean } 文件是否存在
 */
async function FileIsExist(path) {
  return fs.statSync(path)
}

/**
 * 移除旧归档文件
 */
function RemoveOldArch() {
  const TargetArchPath = path.resolve(BASE_ARCH_NAME, BASE_ARCH_NAME)
  if (fs.existsSync(TargetArchPath)) {
    fs.unlinkSync(TargetArchPath)
  }
}

/**
 * 写入文件至包中
 * @param {string|Array<string>} targetPath
 * @param {fs.WriteStream} writeStearm
 */
async function WriteFile(targetPath, writeStearm) {
  const fTargetPaths = Array.isArray(targetPath) ? targetPath : [targetPath]
  const fTargetPath = fTargetPaths.join(path.sep)
  const fInfo = fs.statSync(fTargetPath)
  const FileMate = {}
  if (fInfo.isDirectory()) {
    const subFileList = fs.readdirSync(targetPath)
    for (const subName of subFileList) {
      FileMate[subName] = await WriteFile([...fTargetPaths, subName], writeStearm)
    }
    return FileMate
  }

  const buffer = fs.readFileSync(fTargetPath, {
    flag: 'r'
  })
  const sha256 = createHash('sha256')
  sha256.update(buffer)

  FileMate.sha256 = sha256.digest('hex')
  FileMate.path = fTargetPaths.join('/')
  FileMate.name = path.basename(fTargetPath)
  FileMate.size = fInfo.size
  // 用于文件加密，具体根据业务实现
  FileMate.secret = 'this is a secret'
  // 记录当前文件流指针位置
  FileMate.readPosition = writeStearm.bytesWritten

  // 填充对齐，将文件大小对齐为1024整数倍
  const fillSize = (Math.floor(fInfo.size / 1024) + 1) * 1024

  // 写入文件数据
  await new Promise((resovle, reject) => {
    // 这里的buffer可以配合secret做加密操作
    writeStearm.write(buffer, (error) => {
      if (error) {
        return reject(error)
      }
      resovle()
    })
  })
  // 写入额外对齐空数据
  await new Promise((resovle, reject) => {
    writeStearm.write(Buffer.alloc(fillSize - buffer.length), (error) => {
      if (error) {
        return reject(error)
      }
      resovle()
    })
  })
  return FileMate
}

/**
 * 构建新存档
 * @param {Array<string>} targetDirs
 */
async function MakeArchive(targetDirs) {
  RemoveOldArch()
  DeepMkdir(BASE_ROOT_DIR)
  const TargetArchPath = path.resolve(BASE_ROOT_DIR, BASE_ARCH_NAME)
  const writeStream = fs.createWriteStream(TargetArchPath, {
    flags: 'w+'
  })
  // 将文件先写入4MB大小的空数据
  await new Promise((resolve) => {
    writeStream.write(Buffer.alloc(1024 * 1024 * 4), resolve)
  })
  const RealTargetDir = Array.isArray(targetDirs) ? targetDirs : [targetDirs]
  if (RealTargetDir.length == 0) {
    throw 'The targetDirs argument is required when calling the MakeArchive function'
  }
  const SugarDirMate = {}
  for (const targetDir of RealTargetDir) {
    SugarDirMate[targetDir] = await WriteFile(targetDir, writeStream)
  }
  // 此时SugarDirMate已记录所有打包资源的路径映射关系，将其存入前4MB数据即可
  writeStream.close(() => {
    console.log(`Archive file ${TargetArchPath} has been created successfully`)
    /**
     * 这里文件的映射关系可通过加密存储，避免base64被解密
     * 具体加密过程根据业务来，注意保存密钥，防止泄密
     */
    const content = Buffer.from(JSON.stringify(SugarDirMate)).toString('base64')
    fs.createWriteStream(TargetArchPath, { flags: 'r+', start: 0 }).write(content)
  })
  
}

await MakeArchive(process.argv.slice(2))

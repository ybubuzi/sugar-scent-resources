import fs from 'fs'
/** 归档资源文件最终存放文件夹路径 */
const BASE_ROOT_DIR = 'arch'
/** 最终归档的文件名称 */
const BASE_ARCH_NAME = 'RESOURCE.PAK'

/**
 * 深度创建文件夹
 * 等效`mkdir -p [path]`
 * @param {string} path 目标路径
 * @returns {string} 最终创建的目录
 */
async function DeepMkdir(dirPath){
 if(!dirPath){
    throw 'The dirPath argument is required when calling the DeepMkdir function'
 }
  return new Promise((resolve,reject)=>{
    fs.mkdir(dirPath,{recursive:true},(err,finalPath)=>{
        if(err){
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
async function FileIsExist( path){
    return fs.statSync(path)
}

/**
 * 移除旧归档文件
 */
function RemoveOldArch(){
    const TargetArchPath = path.resolve(BASE_ARCH_NAME,BASE_ARCH_NAME)
}

// FileIsExist('aaa')
const a = DeepMkdir('aa/a')
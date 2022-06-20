import { Command } from 'commander'
import minimist from 'minimist'
import fs from 'fs-extra'
import path from 'path'
import glob from 'glob'
import dayjs from 'dayjs'
import { promisify } from 'util'
import { __VERSION__ } from './env'

const asyncGlob = promisify(glob)

/**
 * 格式化时间
 *
 * @author CaoMeiYouRen
 * @export
 * @param {(number | string | Date)} [date=Date.now()]
 * @param {string} [pattern='YYYY-MM-DD HH:mm:ss.SSS']
 * @returns
 */
export function timeFormat(date: number | string | Date = Date.now(), pattern: string = 'YYYY-MM-DD HH:mm:ss.SSS') {
    if (typeof date === 'number' && date.toString().length === 10) {
        if (date < 1e10) {
            date *= 1000
        }
    }
    return dayjs(date).format(pattern)
}

const program = new Command('ac')
    .description('草梅批量重命名工具')
    .action(async (args) => {
        const { debug = false, input, yes = false, prefix = 'auto', ignore = [] } = args
        if (!input) {
            console.error('必须指定 扫描目录！')
            return
        }

        const inputPath = input.replaceAll('\\', '/')
        const files: string[] = await asyncGlob(inputPath, {
            ignore: ['node_modules/**', '**/node_modules/**', './node_modules/**', '/node_modules/**', 'dist/**', './dist/**', '**/dist/**', '/dist/**', ...ignore],
            absolute: true,
        })
        if (debug) {
            console.log('files', files)
        }
        if (!files?.length) {
            console.error('未匹配到任何指定文件')
            return
        }
        const n = files.length // 文件总数
        const orderNumberLength = Math.floor(Math.log10(n)) + 1 // (n 的对数取整 +1 ) 为 序号的长度
        if (debug) {
            console.log('文件总数 = ', n)
            console.log('序号长度 = ', orderNumberLength)
        }
        if (yes) {
            console.log('开始修改文件名称')
            for (let i = 0; i < files.length; i++) {
                const filePath = files[i]
                const dir = path.dirname(filePath)
                const ext = path.extname(filePath)
                const order = i.toString().padStart(orderNumberLength, '0')
                const date = timeFormat(Date.now(), 'YYYY-MM-DD-HH-mm-ss-SSS')
                const filename = `${prefix}-${date}-${order}${ext}`
                const newPath = path.join(dir, filename)
                console.log(`修改文件 ${filePath} -> ${newPath}`)
                await fs.rename(filePath, newPath)
            }
        } else {
            console.log('匹配到的文件如下，请确认后修改！')
            console.log(files.join('\n'))
        }
    })

program.version(__VERSION__ || '1.0.0', '-v, --version')

const args = process.argv.slice(2)
const argv = minimist(args)

program.option('-d, --debug', 'debug')
program.option('-i, --input <dir>', '指定扫描目录，支持 glob 语法')
program.option('-y, --yes', '直接确认')
program.option('-p, --prefix <name>', '添加的前缀，默认为 auto')
program.option('-g, --ignore <dirs...>', '需要忽略的 dirs')

program.parse(process.argv)

const opts = program.opts()

if (opts.debug) {
    console.log(args)
    console.log(argv)
    console.log(opts)
}

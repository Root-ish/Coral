const fs = require('fs')
const path = require('path')
const babel = require("@babel/core")
const srcDir = path.dirname(path.dirname(__dirname))
const rootDir = path.dirname(path.dirname(path.dirname(__dirname)))
const scriptsDir = path.join(srcDir, 'scripts')
const buildDir = path.join(rootDir, 'lib')
const UglifyJS = require('uglify-js');

const uglifyOptions = {
  'output': {
    'ascii_only': true,
    'comments': /@license/,
    'max_line_len': 500
  }
}

const build = () => {
  fs.readdirSync(scriptsDir).forEach((file) => {
    const classesName = path.parse(file).name
    const classesFile = path.join(scriptsDir, `${classesName}.js`)
    const logError = (event) => {
      console.error(event)
    }

    if (fs.existsSync(classesFile)) {
      const destPath = path.join(buildDir, `${classesName}.js`)
      const callback = destPath
      const file = fs.readFileSync(classesFile).toString()
      const compiledCode = babel.transformSync(file, {});
      const output = UglifyJS.minify(compiledCode.code, uglifyOptions);

      fs.writeFile(destPath, output.code, 'utf-8', (event) => logError(event))
    }
  })
}

build()
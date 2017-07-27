#!/usr/bin/env node

var fs = require('fs');
var path = require('path');

var Remarkable = require('remarkable');
var toc = require('markdown-toc');
var mkdirp = require('mkdirp');

class Converter {
  constructor(src, dst, layout) {
    this.src = src;
    this.dst = dst;
    this.layout = layout;
  }

  processFile(filePath) {
    var fullPath = path.join(this.src, filePath);

    if (filePath[0] === '_') {
      console.info(fullPath, 'Skipped');
      return;
    }

    var ext = path.extname(filePath);
    var destPath = path.join(this.dst, filePath);

    if (ext !== '.md') {
      copy(fullPath, destPath);
      console.info(fullPath, '=>', destPath);
      return;
    }

    destPath = path.join(this.dst, path.basename(filePath, ext) + '.html');
    var html = markdown2html(fs.readFileSync(fullPath, 'utf-8'), this.layout);
    writeTo(destPath, html, 'utf-8');
    console.info(fullPath, '=>', destPath);
  }

  walk(dir='') {
    var fullDirPath = path.join(this.src, dir);
    var files = fs.readdirSync(fullDirPath, 'utf-8');
    files.forEach(file => {
      var stat = fs.statSync(path.join(fullDirPath, file));
      if (stat.isFile()) {
        this.processFile(path.join(dir, file));
      } else if (stat.isDirectory()) {
        this.walk(path.join(dir, file));
      }
    });
  }
}

function markdownParse(str) {
  str = toc.insert(str, {open: 'toc-start\n', close: '\ntoc-end'});

  var title = '';
  md = new Remarkable({breaks: true}).use(function(remarkable) {
    remarkable.renderer.rules.heading_open = function(tokens, idx) {
      if (tokens[idx].hLevel === '1') {
        title = tokens[idx + 1].content;
      }
      return '<br /><h' + tokens[idx].hLevel + ' id="' + toc.slugify(tokens[idx + 1].content) + '">';
    };
  });

  var content = md.render(str)
    .replace('toc-start', '<div class="toc">')
    .replace('toc-end', '</div>');

  return [content, title];
}

function markdown2html(str, layout) {
  var [html, title] = markdownParse(str);

  return layout.replace('{title}', title)
    .replace('{markdown}', html);
}

function writeTo(dest, content, encoding) {
  mkdirp(path.dirname(dest), err => {
    if (err) {
      console.error(err)
      process.exit(1);
    } else {
      fs.writeFileSync(dest, content, encoding);
    }
  });
}

function copy(from, to) {
  writeTo(to, fs.readFileSync(from, null), null);
}


function main() {
  const layout = fs.readFileSync(path.join(__dirname, 'theme/_layout.html'), 'utf-8');
  const converter = new Converter(process.argv[2], path.join(process.argv[3]), layout);
  converter.walk();
  copy(path.join(__dirname, 'theme/styles.css'), path.join(process.argv[3], 'styles.css'));
}

main();

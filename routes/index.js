var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');
var ejs = require('ejs');

var publicDir = path.join(__dirname, '..', 'public');

function titleFromName(name){
  return name && name[0].toUpperCase() + name.slice(1);
}

// Extract <head> content that should be preserved (inline styles/scripts)
function extractHeadContent(html) {
  const headMatch = html.match(/<head[\s\S]*?>([\s\S]*?)<\/head>/i);
  if (!headMatch) return '';
  
  const headContent = headMatch[1];
  const preserved = [];
  
  // Extract inline <style> blocks
  const styleMatches = headContent.matchAll(/<style[\s\S]*?>([\s\S]*?)<\/style>/gi);
  for (const match of styleMatches) {
    preserved.push(match[0]);
  }
  
  // Extract inline <script> blocks (NOT external src)
  const scriptMatches = headContent.matchAll(/<script(?![^>]*\bsrc=)[\s\S]*?>([\s\S]*?)<\/script>/gi);
  for (const match of scriptMatches) {
    preserved.push(match[0]);
  }
  
  return preserved.join('\n');
}

// Auto-register public/*.html and public/*.ejs so they render inside the app layout
try {
  var files = fs.readdirSync(publicDir);
  files.forEach(function(f){
    var ext = path.extname(f).toLowerCase();
    if (ext !== '.html' && ext !== '.ejs') return;

    var full = path.join(publicDir, f);
    var stat;
    try { stat = fs.statSync(full); } catch(e){ return; }
    if (!stat.isFile()) return;

    let name = path.basename(f, ext);
    let routePath = '/' + name;

    let content = fs.readFileSync(full, 'utf8');
    let html;
    try {
      html = (ext === '.ejs') ? ejs.render(content, { title: titleFromName(name) }) : content;
    } catch (renderErr) {
      console.error('Failed to render public file:', full, renderErr);
      return;
    }

    // PRESERVE inline styles/scripts from <head> before removing it
    const headStyles = extractHeadContent(html);

    // extract inner body to avoid nested <html>/<head>/<body>
    var bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    var fragment = bodyMatch ? bodyMatch[1] : html
      .replace(/<!doctype[\s\S]*?>/i, '')
      .replace(/<\/?html[^>]*>/gi, '')
      .replace(/<head[\s\S]*?>[\s\S]*?<\/head>/i, '');

    // REMOVE duplicated header/footer from page fragments (layout supplies them)
    fragment = fragment
      .replace(/<header[\s\S]*?<\/header>/i, '')
      .replace(/<footer[\s\S]*?<\/footer>/i, '');

    // hoist a leading background div so it renders before the header
    let pre = '';
    const bgMatch = fragment.match(/^\s*(<div[^>]*class=["'][^"']*paws-background[^"']*["'][^>]*>[\s\S]*?<\/div>)/i);
    if (bgMatch && bgMatch[1]) {
      pre = bgMatch[1];
      fragment = fragment.replace(bgMatch[1], '');
    }

    // Prepend preserved head content to the fragment
    if (headStyles) {
      fragment = headStyles + '\n' + fragment;
    }

    // register both /name and /name.ext
    router.get(routePath, (req, res) => {
      res.render('static', { pre, raw: fragment, title: titleFromName(name) });
    });
    router.get(routePath + ext, (req, res) => {
      res.render('static', { pre, raw: fragment, title: titleFromName(name) });
    });

    if (name === 'index') {
    // Register root path
    router.get('/', (req, res) => {
      res.render('static', { pre, raw: fragment, title: 'House Delano | Home' });
    });
    
    // Also register /index and /index.html
    router.get('/index', (req, res) => {
      res.render('static', { pre, raw: fragment, title: 'House Delano | Home' });
    });
    router.get('/index.html', (req, res) => {
      res.render('static', { pre, raw: fragment, title: 'House Delano | Home' });
    });

    }
  });
} catch (err) {
  // ignore if public directory not readable
}

module.exports = router;
document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector("header");
  if (!header) return;
  const onScroll = () => {
    if (window.scrollY > 10) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
});

(function(){
  try{
    var nav = document.querySelector('nav.site-nav');
    var btn = document.querySelector('button.nav-toggle');
    var menu = document.getElementById('site-menu');
    if(!nav || !btn || !menu) return;

    function closeOnOutside(e){
      if(!nav.contains(e.target)) {
        menu.classList.remove('open');
        btn.setAttribute('aria-expanded','false');
        document.removeEventListener('click', closeOnOutside);
      }
    }
    btn.addEventListener('click', function(e){
      e.stopPropagation();
      var open = menu.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true':'false');
      if(open) setTimeout(function(){ document.addEventListener('click', closeOnOutside); }, 0);
    });
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape'){
        menu.classList.remove('open');
        btn.setAttribute('aria-expanded','false');
      }
    });
  }catch(e){}
})();

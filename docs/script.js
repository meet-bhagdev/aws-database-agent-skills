document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('.term-copy,.skill-cmd button').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const t=btn.dataset.copy||btn.closest('.term-body')?.querySelector('.cmd')?.textContent||'';
      navigator.clipboard.writeText(t.trim()).then(()=>{
        const o=btn.textContent;btn.textContent='Copied!';btn.classList.add('copied');
        setTimeout(()=>{btn.textContent=o;btn.classList.remove('copied')},2000);
      });
    });
  });
  document.querySelectorAll('.ref-header').forEach(h=>{
    h.addEventListener('click',()=>{
      const b=h.nextElementSibling,open=h.classList.contains('open');
      h.classList.toggle('open');b.classList.toggle('open');
      b.style.maxHeight=open?'0':b.scrollHeight+'px';
    });
    if(h.classList.contains('open'))h.nextElementSibling.style.maxHeight=h.nextElementSibling.scrollHeight+'px';
  });
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click',e=>{e.preventDefault();document.querySelector(a.getAttribute('href'))?.scrollIntoView({behavior:'smooth',block:'start'})});
  });
  const nav=document.querySelector('nav');
  window.addEventListener('scroll',()=>{nav.classList.toggle('scrolled',window.scrollY>20)},{passive:true});
  const obs=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('vis');obs.unobserve(e.target)}})},{threshold:.1,rootMargin:'0px 0px -30px 0px'});
  document.querySelectorAll('.anim').forEach(el=>obs.observe(el));
});

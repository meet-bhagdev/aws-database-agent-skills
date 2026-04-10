document.addEventListener('DOMContentLoaded',()=>{
  // Copy buttons
  document.querySelectorAll('.copy-btn,.skill-copy').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const text=btn.dataset.copy||btn.closest('.install-body')?.querySelector('.cmd')?.textContent||'';
      navigator.clipboard.writeText(text.trim()).then(()=>{
        const orig=btn.textContent;
        btn.textContent='Copied!';
        btn.classList.add('copied');
        setTimeout(()=>{btn.textContent=orig;btn.classList.remove('copied')},2000);
      });
    });
  });

  // Accordion with smooth height
  document.querySelectorAll('.ref-header').forEach(header=>{
    header.addEventListener('click',()=>{
      const body=header.nextElementSibling;
      const isOpen=header.classList.contains('open');
      header.classList.toggle('open');
      body.classList.toggle('open');
      if(!isOpen){body.style.maxHeight=body.scrollHeight+'px'}
      else{body.style.maxHeight='0'}
    });
    // Init open ones
    if(header.classList.contains('open')){
      header.nextElementSibling.style.maxHeight=header.nextElementSibling.scrollHeight+'px';
    }
  });

  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click',e=>{
      e.preventDefault();
      const el=document.querySelector(a.getAttribute('href'));
      if(el)el.scrollIntoView({behavior:'smooth',block:'start'});
    });
  });

  // Nav scroll effect
  const nav=document.querySelector('nav');
  window.addEventListener('scroll',()=>{
    nav.classList.toggle('scrolled',window.scrollY>50);
  },{passive:true});

  // Scroll animations
  const observer=new IntersectionObserver((entries)=>{
    entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('vis');observer.unobserve(e.target)}});
  },{threshold:0.1,rootMargin:'0px 0px -40px 0px'});
  document.querySelectorAll('.anim').forEach(el=>observer.observe(el));

  // Animated counters
  document.querySelectorAll('[data-count]').forEach(el=>{
    const target=parseInt(el.dataset.count);
    const suffix=el.dataset.suffix||'';
    let current=0;
    const step=Math.max(1,Math.floor(target/30));
    const timer=setInterval(()=>{
      current=Math.min(current+step,target);
      el.textContent=current+suffix;
      if(current>=target)clearInterval(timer);
    },30);
  });
});

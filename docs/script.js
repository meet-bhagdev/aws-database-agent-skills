document.addEventListener('DOMContentLoaded',()=>{
  // Copy buttons
  document.querySelectorAll('.copy-btn, .skill-install button').forEach(btn=>{
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

  // Accordion
  document.querySelectorAll('.ref-header').forEach(header=>{
    header.addEventListener('click',()=>{
      header.classList.toggle('open');
      header.nextElementSibling.classList.toggle('open');
    });
  });

  // Smooth scroll for nav links
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click',e=>{
      e.preventDefault();
      const el=document.querySelector(a.getAttribute('href'));
      if(el)el.scrollIntoView({behavior:'smooth',block:'start'});
    });
  });

  // Nav background on scroll
  const nav=document.querySelector('nav');
  window.addEventListener('scroll',()=>{
    nav.style.borderBottomColor=window.scrollY>50?'var(--border)':'transparent';
  });
});

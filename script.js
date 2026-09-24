(() => {
  const loader = document.getElementById('loader');
  const progress = document.getElementById('scrollProgress');
  const typed = document.getElementById('typedText');
  const cursorDot = document.getElementById('cursorDot');
  const cursorRing = document.getElementById('cursorRing');

  window.addEventListener('load', () => setTimeout(() => loader?.classList.add('is-hidden'), 550), {once:true});

  const words = ['Developer','Creator','Software Builder'];
  let wi=0, ci=0, deleting=false;
  const type = () => {
    if (!typed) return;
    const word=words[wi];
    typed.textContent=deleting ? word.slice(0,ci--) : word.slice(0,ci++);
    let delay=deleting?45:85;
    if(!deleting && ci>word.length){delay=1200;deleting=true}
    else if(deleting && ci<0){deleting=false;wi=(wi+1)%words.length;ci=0;delay=250}
    setTimeout(type,delay);
  };
  setTimeout(type,700);

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => { if(entry.isIntersecting) entry.target.classList.add('is-visible'); });
  }, {threshold:.13});
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  const updateProgress = () => {
    const max=document.documentElement.scrollHeight-window.innerHeight;
    progress.style.width=(max>0?(window.scrollY/max)*100:0)+'%';
  };
  window.addEventListener('scroll',updateProgress,{passive:true});
  updateProgress();

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target=document.querySelector(link.getAttribute('href'));
      if(target){e.preventDefault();target.scrollIntoView({behavior:'smooth',block:'start'});}
    });
  });

  const finePointer=window.matchMedia('(pointer:fine)').matches;
  if(finePointer && cursorDot && cursorRing){
    document.body.classList.add('cursor-ready');
    let x=window.innerWidth/2,y=window.innerHeight/2,rx=x,ry=y;
    window.addEventListener('mousemove',e=>{
      x=e.clientX;y=e.clientY;
      cursorDot.style.left=x+'px';cursorDot.style.top=y+'px';
    });
    const raf=()=>{rx+=(x-rx)*.16;ry+=(y-ry)*.16;cursorRing.style.left=rx+'px';cursorRing.style.top=ry+'px';requestAnimationFrame(raf)};
    requestAnimationFrame(raf);
    document.querySelectorAll('a,.magnetic-card').forEach(el=>{
      el.addEventListener('mouseenter',()=>{cursorRing.style.width='54px';cursorRing.style.height='54px';cursorRing.style.borderColor='rgba(140,243,196,.8)'});
      el.addEventListener('mouseleave',()=>{cursorRing.style.width='34px';cursorRing.style.height='34px';cursorRing.style.borderColor='rgba(140,243,196,.5)'});
    });
  }

  if(finePointer){
    document.querySelectorAll('.magnetic').forEach(el=>{
      el.addEventListener('mousemove',e=>{
        const r=el.getBoundingClientRect();
        const dx=(e.clientX-(r.left+r.width/2))*.12,dy=(e.clientY-(r.top+r.height/2))*.12;
        el.style.transform=`translate(${dx}px,${dy}px)`;
      });
      el.addEventListener('mouseleave',()=>el.style.transform='translate(0,0)');
    });
    document.querySelectorAll('.magnetic-card').forEach(card=>{
      card.addEventListener('mousemove',e=>{
        const r=card.getBoundingClientRect();
        const x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
        card.style.transform=`perspective(900px) rotateX(${-y*4}deg) rotateY(${x*5}deg) translateY(-6px)`;
      });
      card.addEventListener('mouseleave',()=>card.style.transform='');
    });
  }

  const orb=document.querySelector('.hero__orb');
  if(orb && !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    window.addEventListener('scroll',()=>{
      const y=window.scrollY;
      orb.style.transform=`translate3d(${Math.min(0,y*.02)}px,${Math.min(70,y*.12)}px,0)`;
    },{passive:true});
  }
})();
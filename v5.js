(()=>{'use strict';
  // Deep links to the tap-board choose the beer tab; event entries stay on Instagram
  // until a confirmed and maintained agenda exists.
  const selectBeerForHash=()=>{
    if(window.location.hash==='#cervezas'){
      document.querySelector('.category-tab[data-category="cervezas"]')?.click();
    }
  };
  window.addEventListener('hashchange', selectBeerForHash);
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',selectBeerForHash,{once:true});
  }else{
    selectBeerForHash();
  }
})();
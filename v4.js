(()=>{'use strict';
  // Feature tiles open the corresponding live menu tab on the same page.
  const navigateToCategory=(value)=>{
    const target=document.querySelector('.category-tab[data-category="'+value+'"]');
    if(target) target.click();
  };
  document.querySelectorAll('[data-target-tab]').forEach(link=>{
    link.addEventListener('click',()=>navigateToCategory(link.dataset.targetTab));
  });
})();
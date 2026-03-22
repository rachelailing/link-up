(function () {
  let e = document.createElement(`link`).relList;
  if (e && e.supports && e.supports(`modulepreload`)) return;
  for (let e of document.querySelectorAll(`link[rel="modulepreload"]`)) n(e);
  new MutationObserver((e) => {
    for (let t of e)
      if (t.type === `childList`)
        for (let e of t.addedNodes) e.tagName === `LINK` && e.rel === `modulepreload` && n(e);
  }).observe(document, { childList: !0, subtree: !0 });
  function t(e) {
    let t = {};
    return (
      e.integrity && (t.integrity = e.integrity),
      e.referrerPolicy && (t.referrerPolicy = e.referrerPolicy),
      e.crossOrigin === `use-credentials`
        ? (t.credentials = `include`)
        : e.crossOrigin === `anonymous`
          ? (t.credentials = `omit`)
          : (t.credentials = `same-origin`),
      t
    );
  }
  function n(e) {
    if (e.ep) return;
    e.ep = !0;
    let n = t(e);
    fetch(e.href, n);
  }
})();
var e = document.getElementById(`burgerBtn`),
  t = document.getElementById(`landingMenu`);
(e &&
  t &&
  e.addEventListener(`click`, () => {
    t.classList.toggle(`show`);
  }),
  document.querySelectorAll(`a[href^="#"]`).forEach((e) => {
    e.addEventListener(`click`, (n) => {
      let r = e.getAttribute(`href`),
        i = document.querySelector(r);
      i &&
        (n.preventDefault(),
        i.scrollIntoView({ behavior: `smooth`, block: `start` }),
        t?.classList.remove(`show`));
    });
  }));

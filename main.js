document.addEventListener('DOMContentLoaded', () => {

  // --- Footer Blur-In Reveal on Scroll ---
  const footer = document.querySelector('.minimal-footer');
  if (footer) {
    const footerObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          footer.classList.add('footer-visible');
        } else {
          footer.classList.remove('footer-visible');
        }
      });
    }, { threshold: 0.2 });
    footerObserver.observe(footer);
  }

  // --- Subtle Parallax Background on Scroll ---
  const isHomePage = document.body.classList.contains('home-page-bg');
  const isWorkPage = document.body.classList.contains('work-page-bg');
  const heroSection = document.querySelector('.scroll-sequence');
  const heroEnd = heroSection ? heroSection.offsetHeight : 0;

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;

    if (isHomePage) {
      // Only start parallax after the hero section ends
      if (scrollY > heroEnd) {
        const delta = (scrollY - heroEnd) * 0.15;
        document.body.style.backgroundPositionY = `calc(50% - ${delta}px)`;
      } else {
        document.body.style.backgroundPositionY = '50%';
      }
    }
  }, { passive: true });

  // --- Sequential Sticky Scroll for Hero Videos ---
  const video2 = document.getElementById('video-2');
  const video3 = document.getElementById('video-3');

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const vh = window.innerHeight;
    
    // We expanded section to 400vh. Max scroll inside this sticky container is 300vh.
    
    // Calculate progression for video 2 (between 50vh and 150vh)
    let p2 = (scrollY - (vh * 0.5)) / vh; 
    if (p2 < 0) p2 = 0;
    if (p2 > 1) p2 = 1;
    
    const inset2 = 100 - (p2 * 100);
    if(video2) {
      video2.style.clipPath = `inset(${inset2}% 0 0 0)`;
      if (p2 > 0.3) video2.classList.add('active-layer'); else video2.classList.remove('active-layer');
    }

    // Calculate progression for video 3 (between 150vh and 250vh)
    let p3 = (scrollY - (vh * 1.5)) / vh; 
    if (p3 < 0) p3 = 0;
    if (p3 > 1) p3 = 1;

    // From scrollY = 250vh to 300vh, p3 is 1 (meaning fully revealed). 
    // This correctly acts as the holding "lock".
    const inset3 = 100 - (p3 * 100);
    if(video3) {
      video3.style.clipPath = `inset(${inset3}% 0 0 0)`;
      if (p3 > 0.3) video3.classList.add('active-layer'); else video3.classList.remove('active-layer');
    }
  });

  // --- Native Hero Video Poster & Unload Logic (No player.js) ---
  const heroIframes = [];
  
  const setupHeroVideo = (iframeId, posterId) => {
    const iframe = document.getElementById(iframeId);
    const poster = document.getElementById(posterId);
    
    if (iframe && poster) {
      // Ensure the URL has &api=1
      let src = iframe.src;
      if (!src.includes('api=1')) {
        src += '&api=1';
        iframe.src = src;
      }

      const heroObj = {
        iframe,
        poster,
        fallbackTimer: null,
        hidePoster: () => {
          if (heroObj.fallbackTimer) {
            clearTimeout(heroObj.fallbackTimer);
            heroObj.fallbackTimer = null;
          }
          poster.style.opacity = '0';
          setTimeout(() => {
            poster.style.display = 'none';
          }, 800);
        }
      };

      // Save the original src so we can restore it later when unloading
      iframe.setAttribute('data-original-src', src);
      
      // Set a fallback timer of 6 seconds just in case messages fail
      heroObj.fallbackTimer = setTimeout(heroObj.hidePoster, 6000);
      
      heroIframes.push(heroObj);
    }
  };

  setupHeroVideo('vimeo-player-1', 'vimeo-poster-1');
  setupHeroVideo('vimeo-player-2', 'vimeo-poster-2');
  setupHeroVideo('vimeo-player-3', 'vimeo-poster-3');

  // Listen to message events from Vimeo iframes to hide poster only when play starts
  window.addEventListener('message', (event) => {
    if (!event.origin.includes('vimeo.com')) return;

    let data;
    try {
      data = JSON.parse(event.data);
    } catch (e) {
      return;
    }

    if (data) {
      const hero = heroIframes.find(h => h.iframe.contentWindow === event.source);
      if (hero) {
        if (data.event === 'ready') {
          // Subscribe to 'play' event
          event.source.postMessage(JSON.stringify({ method: 'addEventListener', value: 'play' }), '*');
        } else if (data.event === 'play') {
          hero.hidePoster();
        }
      }
    }
  });

  // Helper to visually pause and unload hero videos
  const unloadHeroVideos = () => {
    heroIframes.forEach(hero => {
      // Clear any fallback timers
      if (hero.fallbackTimer) {
        clearTimeout(hero.fallbackTimer);
        hero.fallbackTimer = null;
      }

      // Show poster smoothly
      hero.poster.style.display = 'block';
      setTimeout(() => { hero.poster.style.opacity = '1'; }, 50);
      
      // Remove src to violently kill the video decoder process and free memory
      hero.iframe.src = '';
    });
  };

  // Helper to reload hero videos
  const reloadHeroVideos = () => {
    heroIframes.forEach(hero => {
      // Clear any existing fallback timers
      if (hero.fallbackTimer) {
        clearTimeout(hero.fallbackTimer);
        hero.fallbackTimer = null;
      }

      // Ensure poster is shown before reload
      hero.poster.style.display = 'block';
      hero.poster.style.opacity = '1';

      // Restore src to trigger playback
      hero.iframe.src = hero.iframe.getAttribute('data-original-src');
      
      // Start a new fallback timer
      hero.fallbackTimer = setTimeout(hero.hidePoster, 6000);
    });
  };



  // --- Collection Lightbox Modal ---
  const collectionLightbox = document.getElementById('collectionLightbox');
  const collectionClose = document.getElementById('collectionClose');
  const collectionItems = document.querySelectorAll('.collection-item');
  
  let openCollection = null;

  if (collectionLightbox && collectionClose) {
    openCollection = () => {
      document.body.classList.add('lightbox-open');
      collectionLightbox.classList.add('active');
      collectionItems.forEach(item => {
        const iframe = item.querySelector('iframe');
        if (iframe && !iframe.getAttribute('src')) {
           iframe.setAttribute('src', iframe.getAttribute('data-src'));
        }
      });
    };

    const closeCollection = () => {
      document.body.classList.remove('lightbox-open');
      collectionLightbox.classList.remove('active');
      setTimeout(() => {
        collectionItems.forEach(item => {
           const iframe = item.querySelector('iframe');
           if(iframe) iframe.removeAttribute('src');
        });
      }, 400);
    };

    collectionClose.addEventListener('click', closeCollection);
    collectionLightbox.addEventListener('click', (e) => {
      if(e.target === collectionLightbox) closeCollection();
    });

    collectionItems.forEach(item => {
      item.addEventListener('click', () => {
        const vid = item.getAttribute('data-vimeo-id');
        if (lightbox && lightboxIframe) {
          lightbox.classList.add('active');
          lightboxIframe.src = `https://player.vimeo.com/video/${vid}?autoplay=1`;
        }
      });
    });
  }

  // --- Sports Collection Lightbox Modal ---
  const sportsLightbox = document.getElementById('sportsCollectionLightbox');
  const sportsClose = document.getElementById('sportsCollectionClose');
  const sportsTrigger = document.querySelector('.sports-trigger');

  if (sportsLightbox && sportsClose) {
    const sportsItems = sportsLightbox.querySelectorAll('.sports-item');
    const sportsBg = sportsLightbox.querySelector('::before') || sportsLightbox;

    const openSports = () => {
      document.body.classList.add('lightbox-open');
      sportsLightbox.classList.add('active');
      
      // Load background loops for sports items
      sportsItems.forEach(item => {
        const iframe = item.querySelector('iframe');
        if (iframe && !iframe.getAttribute('src')) {
          iframe.setAttribute('src', item.getAttribute('data-loop-src'));
        }
      });
    };

    const closeSports = () => {
      document.body.classList.remove('lightbox-open');
      sportsLightbox.classList.remove('active');
      
      // Unload background loops for sports items
      setTimeout(() => {
        sportsItems.forEach(item => {
          const iframe = item.querySelector('iframe');
          if (iframe) iframe.removeAttribute('src');
        });
      }, 400);
    };

    if (sportsTrigger) {
      sportsTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        openSports();
      });
    }

    sportsClose.addEventListener('click', closeSports);
    sportsLightbox.addEventListener('click', (e) => {
      if (e.target === sportsLightbox) closeSports();
    });

    // Mousemove parallax on background
    sportsLightbox.addEventListener('mousemove', (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20; // max 10px shift
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      sportsLightbox.style.setProperty('--parallax-x', `${x}px`);
      sportsLightbox.style.setProperty('--parallax-y', `${y}px`);
    });

    // Click-to-open for each sports item
    sportsItems.forEach(item => {
      item.addEventListener('click', () => {
        const vid = item.getAttribute('data-vimeo-id');
        if (lightbox && lightboxIframe) {
          lightbox.classList.add('active');
          lightboxIframe.src = `https://player.vimeo.com/video/${vid}?autoplay=1`;
        }
      });
    });
  }

  // --- Events Collection Lightbox Modal ---
  const eventsLightbox = document.getElementById('eventsCollectionLightbox');
  const eventsClose = document.getElementById('eventsCollectionClose');
  const eventsTrigger = document.querySelector('.events-trigger');

  if (eventsLightbox && eventsClose) {
    const eventsItems = eventsLightbox.querySelectorAll('.sports-item');

    const openEvents = () => {
      document.body.classList.add('lightbox-open');
      eventsLightbox.classList.add('active');
      
      // Load background loops for events items
      eventsItems.forEach(item => {
        const iframe = item.querySelector('iframe');
        if (iframe && !iframe.getAttribute('src')) {
          iframe.setAttribute('src', item.getAttribute('data-loop-src'));
        }
      });
    };

    const closeEvents = () => {
      document.body.classList.remove('lightbox-open');
      eventsLightbox.classList.remove('active');
      
      // Unload background loops for events items
      setTimeout(() => {
        eventsItems.forEach(item => {
          const iframe = item.querySelector('iframe');
          if (iframe) iframe.removeAttribute('src');
        });
      }, 400);
    };

    if (eventsTrigger) {
      eventsTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        openEvents();
      });
    }

    eventsClose.addEventListener('click', closeEvents);
    eventsLightbox.addEventListener('click', (e) => {
      if (e.target === eventsLightbox) closeEvents();
    });

    // Mousemove parallax on background
    eventsLightbox.addEventListener('mousemove', (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20; // max 10px shift
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      eventsLightbox.style.setProperty('--parallax-x', `${x}px`);
      eventsLightbox.style.setProperty('--parallax-y', `${y}px`);
    });

    // Click-to-open for each events item
    eventsItems.forEach(item => {
      item.addEventListener('click', () => {
        const vid = item.getAttribute('data-vimeo-id');
        if (lightbox && lightboxIframe) {
          lightbox.classList.add('active');
          lightboxIframe.src = `https://player.vimeo.com/video/${vid}?autoplay=1`;
        }
      });
    });
  }

  // --- Cinematic Shorts Collection Lightbox Modal ---
  const shortsLightbox = document.getElementById('shortsCollectionLightbox');
  const shortsClose = document.getElementById('shortsCollectionClose');
  const shortsTrigger = document.querySelector('.shorts-trigger');

  if (shortsLightbox && shortsClose) {
    const shortsItems = shortsLightbox.querySelectorAll('.sports-item');

    const openShorts = () => {
      document.body.classList.add('lightbox-open');
      shortsLightbox.classList.add('active');
      
      // Load background loops for cinematic shorts items
      shortsItems.forEach(item => {
        const iframe = item.querySelector('iframe');
        if (iframe && !iframe.getAttribute('src')) {
          iframe.setAttribute('src', item.getAttribute('data-loop-src'));
        }
      });
    };

    const closeShorts = () => {
      document.body.classList.remove('lightbox-open');
      shortsLightbox.classList.remove('active');
      
      // Unload background loops for cinematic shorts items
      setTimeout(() => {
        shortsItems.forEach(item => {
          const iframe = item.querySelector('iframe');
          if (iframe) iframe.removeAttribute('src');
        });
      }, 400);
    };

    if (shortsTrigger) {
      shortsTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        openShorts();
      });
    }

    shortsClose.addEventListener('click', closeShorts);
    shortsLightbox.addEventListener('click', (e) => {
      if (e.target === shortsLightbox) closeShorts();
    });

    // Mousemove parallax on background
    shortsLightbox.addEventListener('mousemove', (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20; // max 10px shift
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      shortsLightbox.style.setProperty('--parallax-x', `${x}px`);
      shortsLightbox.style.setProperty('--parallax-y', `${y}px`);
    });

    // Click-to-open for each cinematic shorts item
    shortsItems.forEach(item => {
      item.addEventListener('click', () => {
        const vid = item.getAttribute('data-vimeo-id');
        if (lightbox && lightboxIframe) {
          lightbox.classList.add('active');
          lightboxIframe.src = `https://player.vimeo.com/video/${vid}?autoplay=1`;
        }
      });
    });
  }

  // Pre-declare for cross-reference between Fashion and Juwelmania sections
  let openJuwelmaniaSub = null;

  // --- Fashion Collection Lightbox Modal ---
  const fashionLightbox = document.getElementById('fashionCollectionLightbox');
  const fashionClose = document.getElementById('fashionCollectionClose');
  const fashionTrigger = document.querySelector('.fashion-trigger');

  if (fashionLightbox && fashionClose) {
    const fashionItems = fashionLightbox.querySelectorAll('.sports-item:not(.juwelmania-sub-trigger)');
    const juwelmaniaSubTrigger = fashionLightbox.querySelector('.juwelmania-sub-trigger');

    const openFashion = () => {
      document.body.classList.add('lightbox-open');
      fashionLightbox.classList.add('active');
      
      // Physically unload hero videos to completely free up browser video decoding limits
      unloadHeroVideos();
      
      const allFashionItems = fashionLightbox.querySelectorAll('.sports-item');
      allFashionItems.forEach(item => {
        const iframe = item.querySelector('iframe');
        if (iframe && !iframe.getAttribute('src')) {
          iframe.setAttribute('src', iframe.getAttribute('data-src'));
        }
      });
    };

    const closeFashion = () => {
      document.body.classList.remove('lightbox-open');
      fashionLightbox.classList.remove('active');
      
      // Reload hero videos from scratch
      reloadHeroVideos();
      
      const allFashionItems = fashionLightbox.querySelectorAll('.sports-item');
      setTimeout(() => {
        allFashionItems.forEach(item => {
          const iframe = item.querySelector('iframe');
          if (iframe) iframe.removeAttribute('src');
        });
      }, 400);
    };

    if (fashionTrigger) {
      fashionTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        openFashion();
      });
    }

    fashionClose.addEventListener('click', closeFashion);
    fashionLightbox.addEventListener('click', (e) => {
      if (e.target === fashionLightbox) closeFashion();
    });

    // Mousemove parallax on background
    fashionLightbox.addEventListener('mousemove', (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      fashionLightbox.style.setProperty('--parallax-x', `${x}px`);
      fashionLightbox.style.setProperty('--parallax-y', `${y}px`);
    });

    // Click-to-open for regular fashion items
    fashionItems.forEach(item => {
      item.addEventListener('click', () => {
        const vid = item.getAttribute('data-vimeo-id');
        if (lightbox && lightboxIframe) {
          lightbox.classList.add('active');
          lightboxIframe.src = `https://player.vimeo.com/video/${vid}?autoplay=1`;
        }
      });
    });

    // Juwelmania sub-trigger opens the Juwelmania collection
    if (juwelmaniaSubTrigger) {
      juwelmaniaSubTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        openJuwelmaniaSub();
      });
    }
  }

  // --- Juwelmania Sub-Collection (inside Fashion) ---
  const juwelmaniaSub = document.getElementById('juwelmaniaSublightbox');
  const juwelmaniaSubClose = document.getElementById('juwelmaniaSubClose');

  if (juwelmaniaSub && juwelmaniaSubClose) {
    const juwelmaniaSubItems = juwelmaniaSub.querySelectorAll('.collection-item');

    openJuwelmaniaSub = () => {
      juwelmaniaSub.classList.add('active');
      juwelmaniaSubItems.forEach(item => {
        const iframe = item.querySelector('iframe');
        if (iframe && !iframe.getAttribute('src')) {
          iframe.setAttribute('src', iframe.getAttribute('data-src'));
        }
      });
    };

    const closeJuwelmaniaSub = () => {
      juwelmaniaSub.classList.remove('active');
      setTimeout(() => {
        juwelmaniaSubItems.forEach(item => {
          const iframe = item.querySelector('iframe');
          if (iframe) iframe.removeAttribute('src');
        });
      }, 400);
    };

    juwelmaniaSubClose.addEventListener('click', closeJuwelmaniaSub);
    juwelmaniaSub.addEventListener('click', (e) => {
      if (e.target === juwelmaniaSub) closeJuwelmaniaSub();
    });

    juwelmaniaSubItems.forEach(item => {
      item.addEventListener('click', () => {
        const vid = item.getAttribute('data-vimeo-id');
        if (lightbox && lightboxIframe) {
          lightbox.classList.add('active');
          lightboxIframe.src = `https://player.vimeo.com/video/${vid}?autoplay=1`;
        }
      });
    });
  }

  // --- Video Lightbox Modal ---
  const lightbox = document.getElementById('videoLightbox');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxIframe = document.getElementById('lightboxIframe');

  if (lightbox && lightboxClose && lightboxIframe) {
    const closeLightbox = () => {
      const anyCollectionActive = 
        (collectionLightbox && collectionLightbox.classList.contains('active')) ||
        (sportsLightbox && sportsLightbox.classList.contains('active')) ||
        (fashionLightbox && fashionLightbox.classList.contains('active')) ||
        (juwelmaniaSub && juwelmaniaSub.classList.contains('active'));
      if (!anyCollectionActive) {
        document.body.classList.remove('lightbox-open');
      }
      lightbox.classList.remove('active');
      setTimeout(() => { lightboxIframe.src = ''; }, 400); 
    };

    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
      if(e.target === lightbox) closeLightbox();
    });
  }

  // --- Hero Clickables (Index Page) ---
  const heroClickables = document.querySelectorAll('.hero-clickable');
  heroClickables.forEach(item => {
    item.addEventListener('click', () => {
      const vid = item.getAttribute('data-vimeo-id');
      if (lightbox && lightboxIframe) {
        document.body.classList.add('lightbox-open');
        lightbox.classList.add('active');
        lightboxIframe.src = `https://player.vimeo.com/video/${vid}?autoplay=1`;
      }
    });
  });

  // --- Video Hover Play/Pause (Portfolio Items & Masonry) ---
  const dynamicItems = document.querySelectorAll('.portfolio-item, .masonry-item');
  
  dynamicItems.forEach(item => {
    const video = item.querySelector('.portfolio-video, .masonry-video');
    const poster = item.querySelector('.vimeo-hover-poster');
    
    if (video) {
      if (video.tagName === 'IFRAME') {
        let player = null;
        let initialized = false;
        const vid = video.getAttribute('data-vimeo-id');
        
        // Setup click to open lightbox or collection
        item.style.cursor = 'pointer';
        item.addEventListener('click', () => {
          if (item.classList.contains('collection-trigger') && openCollection) {
            openCollection();
          } else if (lightbox && lightboxIframe) {
            document.body.classList.add('lightbox-open');
            lightbox.classList.add('active');
            lightboxIframe.src = `https://player.vimeo.com/video/${vid}?autoplay=1`;
          }
        });
        
        item.addEventListener('mouseenter', () => {
          if (!initialized && window.Vimeo) {
            video.src = `https://player.vimeo.com/video/${vid}?background=1&autoplay=1&loop=1&byline=0&title=0`;
            player = new Vimeo.Player(video);
            player.on('play', () => {
               if(poster) poster.style.opacity = '0';
            });
            initialized = true;
          } else if (player) {
            player.play();
            if(poster) poster.style.opacity = '0';
          }
        });
        
        item.addEventListener('mouseleave', () => {
          if (player) {
            player.pause();
            if(poster) poster.style.opacity = '1';
          }
        });
      } else {
        video.pause();
        item.addEventListener('mouseenter', () => {
          let playPromise = video.play();
          if (playPromise !== undefined) playPromise.catch(() => {});
        });
        item.addEventListener('mouseleave', () => {
          video.pause();
        });
      }
    }
  });

  // --- Deep-linking to category lightboxes from hash URL ---
  const checkHashAndOpen = () => {
    const hash = window.location.hash;
    if (hash === '#sports') {
      const trigger = document.querySelector('.sports-trigger');
      if (trigger) trigger.click();
    } else if (hash === '#fashion') {
      const trigger = document.querySelector('.fashion-trigger');
      if (trigger) trigger.click();
    } else if (hash === '#events') {
      const trigger = document.querySelector('.events-trigger');
      if (trigger) trigger.click();
    } else if (hash === '#shorts') {
      const trigger = document.querySelector('.shorts-trigger');
      if (trigger) trigger.click();
    }
  };

  // Check on initial load
  setTimeout(checkHashAndOpen, 350);
  // Also check if the hash changes dynamically
  window.addEventListener('hashchange', checkHashAndOpen);

});

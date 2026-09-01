/* ==========================================
       LOAD ICONS
    =========================================== */

    lucide.createIcons();

    // Refresh icons after the enhanced service/tool markup.
    requestAnimationFrame(() => lucide.createIcons());



    /* ==========================================
       ACTIVE NAVIGATION
    =========================================== */

    const sections =
      document.querySelectorAll("section");


    const navItems =
      document.querySelectorAll(".nav-item");


    /* ==========================================
       SECTION SNAP REVEALS

       Build a small set of visual units for each section so the
       whole section arrives in a coordinated, staggered motion.
       The project carousel itself remains untouched so its own
       smooth scroll animation continues to work independently.
    =========================================== */

    const revealSelectors = [
      ".section-illustration",
      ".section-content > *",
      ".hero-content > *",
      ".hero-visual > *",
      ".profile-container",
      ".about-content > *",
      ".services-layout > *",
      ".service-item",
      ".tools-section",
      ".projects-header",
      ".project-tabs",
      ".carousel-zone",
      ".project-footer",
      ".scroll-hint",
      ".cta-content > *",
      ".button-group > *",
      ".contact-links > *",
      ".footer",
      ".scroll-indicator"
    ];

    function prepareSectionReveal(section) {
      const targets = [];

      /* First keep the intentional high-level animation units. */
      revealSelectors.forEach((selector) => {
        section.querySelectorAll(selector).forEach((el) => {
          if (!targets.includes(el)) targets.push(el);
        });
      });

      /* Then pick up remaining visible leaf elements so every visual part
         of a section participates in the snap entrance. SVG internals are
         intentionally skipped because their parent illustration is animated
         as one unit. The project cards are also left to their own carousel
         transform system. */
      const ignoredTags = new Set([
        "SCRIPT", "STYLE", "NOSCRIPT", "SVG", "PATH", "G", "CIRCLE",
        "RECT", "LINE", "POLYLINE", "POLYGON", "ELLIPSE", "DEFS",
        "CLIPPATH", "MASK", "USE"
      ]);

      section.querySelectorAll("*").forEach((el) => {
        if (ignoredTags.has(el.tagName)) return;
        if (el.closest(".project-card")) return;
        if (el.closest(".image-modal")) return;

        const hasVisualChild = Array.from(el.children).some((child) => {
          if (ignoredTags.has(child.tagName)) return false;
          if (child.closest(".project-card")) return false;
          return true;
        });

        if (!hasVisualChild && !targets.includes(el)) {
          targets.push(el);
        }
      });

      /* Remove nested duplicates where a parent unit already controls the
         reveal; this prevents compounded transforms. */
      const filtered = targets.filter((el) => {
        return !targets.some((parent) => parent !== el && parent.contains(el));
      });

      filtered.forEach((el, index) => {
        el.classList.add("section-reveal-target");
        el.style.setProperty(
          "--section-delay",
          `${Math.min(index * 55, 700)}ms`
        );
      });

      section._revealTargets = filtered;
    }

    sections.forEach(prepareSectionReveal);


    function revealSection(section) {
      const targets = section._revealTargets || [];

      /* Reset first so the animation plays again every time the user
         snaps away and comes back to a section. */
      targets.forEach((el) => {
        el.classList.remove("section-revealed");
      });

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          targets.forEach((el) => {
            el.classList.add("section-revealed");
          });
        });
      });
    }


    const observer =
      new IntersectionObserver(

        (entries) => {

          entries.forEach((entry) => {

            if (entry.isIntersecting) {

              navItems.forEach((item) => {

                item.classList.remove("active");

              });


              const activeNav =
                document.querySelector(

                  `.nav-item[data-section="${entry.target.id}"]`

                );


              if (activeNav) {

                activeNav.classList.add("active");

              }

              revealSection(entry.target);

            }

          });

        },

        {
          threshold: 0.55
        }

      );


    sections.forEach((section) => {

      observer.observe(section);

    });

    /* Animate the first section immediately on initial load. */
    if (sections[0]) {
      revealSection(sections[0]);
    }



    /* ==========================================
       PROJECT DATA

       Update your projects directly in index.html inside
       #projectData. Add another .project-source article
       to any category and the carousel will pick it up
       automatically — no JavaScript editing needed.
    =========================================== */

    const projectSources =
      Array.from(
        document.querySelectorAll('#projectData .project-source')
      );

    const projects = projectSources.reduce((grouped, source) => {
      const category = source.dataset.category;
      const image = source.querySelector('img');

      if (!category || !image) {
        return grouped;
      }

      if (!grouped[category]) {
        grouped[category] = [];
      }

      grouped[category].push({
        title: source.dataset.title || image.alt || 'PROJECT',
        description: source.dataset.description || '',
        image: image.getAttribute('src'),
        fallbackImage: source.dataset.fallback || ''
      });

      return grouped;
    }, {});

    const categoryAliases = {
      anteiku: 'anteiku',
      crusaders: 'crusaders',
      other: 'other'
    };

    /* ==========================================
       PROJECT VARIABLES
    =========================================== */

    let currentCategory =
      "anteiku";


    let currentIndex =
      0;


    let projectScrolling =
      false;


    const carousel =
      document.getElementById("carousel");


    const projectTitle =
      document.getElementById("projectTitle");


    const projectDescription =
      document.getElementById("projectDescription");


    const projectCounter =
      document.getElementById("projectCounter");


    const tabs =
      document.querySelectorAll(".project-tab");



    /* ==========================================
       RENDER PROJECTS
    =========================================== */

    function renderProjects() {

      const categoryProjects =
        projects[currentCategory];

      /* Build the cards only when the category changes or on first load.
         After that, keep the same DOM nodes so CSS transitions can animate
         the cards smoothly from one carousel position to the next. */
      const needsRebuild =
        carousel.dataset.category !== currentCategory ||
        carousel.children.length !== categoryProjects.length;

      if (needsRebuild) {

        carousel.innerHTML = "";
        carousel.dataset.category = currentCategory;

        categoryProjects.forEach((project, index) => {

          const card = document.createElement("div");

          card.classList.add("project-card");

          card.innerHTML = `
            <img
              src="${project.image}"
              alt="${project.title}"
            >
          `;

          const projectImage = card.querySelector("img");

          projectImage.addEventListener("error", () => {
            if (project.fallbackImage && projectImage.src !== new URL(project.fallbackImage, window.location.href).href) {
              projectImage.src = project.fallbackImage;
            }
          }, { once: true });

          projectImage.addEventListener("click", (event) => {
            event.stopPropagation();

            // Only the active project opens the full-size viewer.
            // Clicking an inactive project simply makes it active.
            if (card.classList.contains("active")) {
              openImageModal(project.image, project.title);
            } else {
              currentIndex = index;
              renderProjects();
            }
          });

          card.dataset.projectIndex = index;

          card.addEventListener("click", () => {
            currentIndex = index;
            renderProjects();
          });

          carousel.appendChild(card);

        });
      }

      const previousIndex =
        (currentIndex - 1 + categoryProjects.length) % categoryProjects.length;

      const nextIndex =
        (currentIndex + 1) % categoryProjects.length;

      const previousFarIndex =
        (currentIndex - 2 + categoryProjects.length) % categoryProjects.length;

      const nextFarIndex =
        (currentIndex + 2) % categoryProjects.length;

      /* Reassign positions only. Because the elements are persistent,
         the existing transform transition creates the smooth scroll. */
      Array.from(carousel.children).forEach((card, index) => {

        card.classList.remove(
          "active",
          "prev",
          "next",
          "prev-far",
          "next-far",
          "hidden-left",
          "hidden-right"
        );

        if (index === currentIndex) {
          card.classList.add("active");
        }
        else if (index === previousIndex) {
          card.classList.add("prev");
        }
        else if (index === nextIndex) {
          card.classList.add("next");
        }
        else if (categoryProjects.length > 4 && index === previousFarIndex) {
          card.classList.add("prev-far");
        }
        else if (categoryProjects.length > 4 && index === nextFarIndex) {
          card.classList.add("next-far");
        }
        else if (index < currentIndex) {
          card.classList.add("hidden-left");
        }
        else {
          card.classList.add("hidden-right");
        }
      });

      /* ACTIVE PROJECT INFO */
      const activeProject = categoryProjects[currentIndex];

      projectTitle.textContent = activeProject.title;

      projectDescription.textContent =
        activeProject.description;

      projectCounter.textContent =
        `${String(currentIndex + 1).padStart(2, "0")}
        /
        ${String(categoryProjects.length).padStart(2, "0")}`;
    }



    /* ==========================================
       FULL-SIZE PROJECT IMAGE VIEWER
    =========================================== */

    const imageModal = document.getElementById("imageModal");
    const imageModalImage = document.getElementById("imageModalImage");
    const imageModalClose = document.getElementById("imageModalClose");

    function openImageModal(src, alt) {
      if (!imageModal || !imageModalImage) return;
      imageModalImage.src = src;
      imageModalImage.alt = alt || "Project image";
      imageModal.classList.add("is-open");
      document.body.classList.add("modal-open");
      imageModalClose?.focus();
    }

    function closeImageModal() {
      if (!imageModal) return;
      imageModal.classList.remove("is-open");
      document.body.classList.remove("modal-open");
      imageModalImage.src = "";
    }

    imageModalClose?.addEventListener("click", closeImageModal);
    imageModal?.addEventListener("click", (event) => {
      if (event.target === imageModal) closeImageModal();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && imageModal?.classList.contains("is-open")) {
        closeImageModal();
      }
    });


    /* ==========================================
       CATEGORY SWITCHER
    =========================================== */

    tabs.forEach((tab) => {

      tab.addEventListener(
        "click",
        () => {


          tabs.forEach((item) => {

            item.classList.remove(
              "active"
            );

          });


          tab.classList.add(
            "active"
          );


          currentCategory =
            tab.dataset.category;


          currentIndex =
            0;


          renderProjects();

        }
      );

    });



    /* ==========================================
       PROJECT SCROLL

       This only activates when
       the cursor is inside the carousel.
    =========================================== */

    carousel.addEventListener(
      "wheel",

      (event) => {

        event.preventDefault();


        if (projectScrolling) {
          return;
        }


        projectScrolling =
          true;


        const categoryProjects =
          projects[currentCategory];


        if (event.deltaY > 0) {

          currentIndex =

            (
              currentIndex + 1
            )

            %

            categoryProjects.length;

        }


        else {

          currentIndex =

            (
              currentIndex - 1
              + categoryProjects.length
            )

            %

            categoryProjects.length;

        }


        renderProjects();


        setTimeout(
          () => {

            projectScrolling =
              false;

          },

          900
        );

      },

      {
        passive: false
      }

    );



    /* ==========================================
       INITIAL PROJECT RENDER
    =========================================== */

    renderProjects();


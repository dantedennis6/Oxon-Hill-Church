
/*
=========================================
OXON HILL CHURCH OF CHRIST
FEATURED EVENTS MANAGEMENT

Loads upcoming and past event cards
from featured-events.json.

Event information can be managed
through Decap CMS.
=========================================
*/

(function () {
  "use strict";

  /* EVENT CONTAINERS */

  const upcomingContainer =
    document.getElementById("upcoming-events-grid");

  const pastContainer =
    document.getElementById("past-events-grid");

  if (!upcomingContainer || !pastContainer) {
    console.error("Featured event containers were not found.");
    return;
  }


  /* CAMERA PLACEHOLDER */

  const cameraSVG = `
    <svg
      class="placeholder-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true">

      <path d="M14 4H9l-2 3H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-4l-2-3Z"/>

      <circle cx="12" cy="13" r="3.5"/>
    </svg>
  `;


  /* GET CURRENT EASTERN DATE */

  function getEasternDateKey() {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(new Date());

    const getPart = type =>
      parts.find(part => part.type === type).value;

    return (
      getPart("year") + "-" +
      getPart("month") + "-" +
      getPart("day")
    );
  }


  /* VALIDATE EVENT DATE */

  function isValidDate(value) {
    if (
      typeof value !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
      return false;
    }

    const [year, month, day] =
      value.split("-").map(Number);

    const date = new Date(year, month - 1, day);

    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  }


  /* FORMAT DATE FOR DISPLAY */

  function formatEventDate(value) {
    if (!isValidDate(value)) {
      return "";
    }

    const [year, month, day] =
      value.split("-").map(Number);

    const date = new Date(year, month - 1, day);

    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric"
    });
  }


  /* CREATE TEXT ELEMENT */

  function addText(parent, tag, className, value) {
    const element = document.createElement(tag);

    if (className) {
      element.className = className;
    }

    element.textContent = value;
    parent.appendChild(element);

    return element;
  }


  /* CREATE PHOTO PLACEHOLDER */

  function createPhotoPlaceholder(title) {
    const placeholder = document.createElement("div");
    placeholder.className = "photo-placeholder";

    placeholder.innerHTML = cameraSVG;

    addText(
      placeholder,
      "span",
      "",
      title || "Congregational Event"
    );

    addText(
      placeholder,
      "small",
      "",
      "Photo Coming Soon"
    );

    return placeholder;
  }


  /* DETERMINE EVENT STATUS */

  function getEventStatus(event, today) {
    if (isValidDate(event.date)) {
      return event.date >= today
        ? "upcoming"
        : "past";
    }

    return event.status === "upcoming"
      ? "upcoming"
      : "past";
  }


  /* CREATE EVENT CARD */

  function createEventCard(event, status) {
    const card = document.createElement("article");
    card.className = "highlight-card";


    /* EVENT IMAGE */

    const media = document.createElement("div");
    media.className = "highlight-image";

    if (
      typeof event.image === "string" &&
      event.image.trim() !== ""
    ) {
      const image = document.createElement("img");

      image.src = event.image;
      image.alt =
        event.image_alt ||
        event.title ||
        "Congregational Event";

      image.loading = "lazy";

      image.onerror = function () {
        image.remove();

        media.prepend(
          createPhotoPlaceholder(event.title)
        );
      };

      media.appendChild(image);

    } else {
      media.appendChild(
        createPhotoPlaceholder(event.title)
      );
    }


    /* UPCOMING OR PAST BADGE */

    addText(
      media,
      "span",
      status === "upcoming"
        ? "highlight-badge upcoming-badge"
        : "highlight-badge past-badge",
      status === "upcoming"
        ? "UPCOMING EVENT"
        : "PAST EVENT"
    );

    card.appendChild(media);


    /* EVENT INFORMATION */

    const content = document.createElement("div");
    content.className = "highlight-content";


    /* CATEGORY */

    if (event.category) {
      addText(
        content,
        "p",
        "highlight-category",
        event.category.toUpperCase()
      );
    }


    /* EVENT TITLE */

    addText(
      content,
      "h3",
      "",
      event.title || "Untitled Event"
    );


    /* DESCRIPTION */

    if (event.description) {
      addText(
        content,
        "p",
        "highlight-description",
        event.description
      );
    }


    /* DATE AND TIME */

    const formattedDate =
      formatEventDate(event.date);

    if (formattedDate || event.time) {
      const details = document.createElement("div");
      details.className = "highlight-event-details";

      if (formattedDate) {
        addText(
          details,
          "span",
          "highlight-date",
          formattedDate
        );
      }

      if (event.time) {
        addText(
          details,
          "span",
          "highlight-time",
          event.time
        );
      }

      content.appendChild(details);
    }


    /* CONTACT LINK FOR UPCOMING EVENTS */

    if (status === "upcoming") {
      const contactLink = document.createElement("a");

      contactLink.href = "./ContactPage.html";
      contactLink.className = "highlight-link";
      contactLink.textContent = "Contact Us for Details";

      content.appendChild(contactLink);
    }

    card.appendChild(content);

    return card;
  }


  /* LOAD EVENTS FROM JSON */

  async function loadFeaturedEvents() {
    try {
      const response = await fetch(
        "./featured-events.json",
        { cache: "no-store" }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load featured events: " +
          response.status
        );
      }

      const data = await response.json();

      const events = Array.isArray(data.events)
        ? data.events
        : [];

      const today = getEasternDateKey();

      const upcomingEvents = [];
      const pastEvents = [];


      /* ORGANIZE EVENTS */

      events.forEach(event => {
        if (
          !event ||
          typeof event.title !== "string" ||
          event.title.trim() === ""
        ) {
          return;
        }

        const status = getEventStatus(event, today);

        if (status === "upcoming") {
          upcomingEvents.push(event);
        } else {
          pastEvents.push(event);
        }
      });


      /* SORT UPCOMING EVENTS */

      upcomingEvents.sort((a, b) => {
        const dateA = isValidDate(a.date)
          ? a.date
          : "9999-12-31";

        const dateB = isValidDate(b.date)
          ? b.date
          : "9999-12-31";

        return dateA.localeCompare(dateB);
      });


      /* SORT PAST EVENTS */

      pastEvents.sort((a, b) => {
        const dateA = isValidDate(a.date)
          ? a.date
          : "";

        const dateB = isValidDate(b.date)
          ? b.date
          : "";

        return dateB.localeCompare(dateA);
      });


      /* CLEAR EXISTING CARDS */

      upcomingContainer.replaceChildren();
      pastContainer.replaceChildren();


      /* DISPLAY UPCOMING EVENTS */

      upcomingEvents.forEach(event => {
        upcomingContainer.appendChild(
          createEventCard(event, "upcoming")
        );
      });


      /* DISPLAY PAST EVENTS */

      pastEvents.forEach(event => {
        pastContainer.appendChild(
          createEventCard(event, "past")
        );
      });


      /* EMPTY UPCOMING EVENTS */

      if (upcomingEvents.length === 0) {
        addText(
          upcomingContainer,
          "p",
          "empty-events-message",
          "Please check back for upcoming events."
        );
      }


      /* EMPTY PAST EVENTS */

      if (pastEvents.length === 0) {
        addText(
          pastContainer,
          "p",
          "empty-events-message",
          "Past event highlights will appear here."
        );
      }

    } catch (error) {
      console.error(
        "Error loading featured events:",
        error
      );

      upcomingContainer.replaceChildren();
      pastContainer.replaceChildren();

      addText(
        upcomingContainer,
        "p",
        "empty-events-message",
        "Featured events are temporarily unavailable."
      );
    }
  }


  /* INITIALIZE FEATURED EVENTS */

  loadFeaturedEvents();

})();


/* Featured cards are managed via featured-events.json / Decap CMS. */
(function () {
  const upcomingContainer = document.getElementById('upcoming-events-grid');
  const pastContainer = document.getElementById('past-events-grid');
  if (!upcomingContainer || !pastContainer) return;

  const cameraSVG = '<svg class="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4H9l-2 3H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-4l-2-3Z"/><circle cx="12" cy="13" r="3.5"/></svg>';

  const easternDateKey = () => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(new Date());

    const get = type => parts.find(p => p.type === type).value;
    return `${get('year')}-${get('month')}-${get('day')}`;
  };

  const addText = (parent, tag, className, value) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    el.textContent = value;
    parent.appendChild(el);
    return el;
  };

  const formatDate = value => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return '';

    const [y, m, d] = value.split('-').map(Number);
    const date = new Date(y, m - 1, d);

    if (
      date.getFullYear() !== y ||
      date.getMonth() !== m - 1 ||
      date.getDate() !== d
    ) return '';

    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  function renderCard(event, status) {
    const card = document.createElement('article');
    card.className = 'highlight-card';

    const media = document.createElement('div');
    media.className = 'highlight-image';

    if (event.image && typeof event.image === 'string') {
      const img = document.createElement('img');
      img.src = event.image;
      img.alt = event.image_alt || event.title || 'Congregational event';
      img.loading = 'lazy';

      img.onerror = () => {
        img.remove();

        const placeholder = document.createElement('div');
        placeholder.className = 'photo-placeholder';
        placeholder.innerHTML = cameraSVG;

        addText(placeholder, 'span', '', event.title || 'Event photo');
        addText(placeholder, 'small', '', 'Photo Coming Soon');
        media.prepend(placeholder);
      };

      media.appendChild(img);
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'photo-placeholder';
      placeholder.innerHTML = cameraSVG;

      addText(placeholder, 'span', '', event.title || 'Event photo');
      addText(placeholder, 'small', '', 'Photo Coming Soon');
      media.appendChild(placeholder);
    }

    addText(
      media,
      'span',
      `highlight-badge ${status === 'upcoming' ? 'upcoming-badge' : 'past-badge'}`,
      status === 'upcoming' ? 'UPCOMING EVENT' : 'PAST EVENT'
    );

    card.appendChild(media);

    const content = document.createElement('div');
    content.className = 'highlight-content';

    if (event.category) {
      addText(content, 'p', 'highlight-category', event.category.toUpperCase());
    }

    addText(content, 'h3', '', event.title || 'Untitled Event');

    if (event.description) {
      addText(content, 'p', 'highlight-description', event.description);
    }

    if (event.date || event.time) {
      const details = document.createElement('div');
      details.className = 'highlight-event-details';

      const formatted = formatDate(event.date);

      if (formatted) {
        addText(details, 'span', 'highlight-date', formatted);
      }

      if (event.time) {
        addText(details, 'span', 'highlight-time', event.time);
      }

      content.appendChild(details);
    }

    card.appendChild(content);
    return card;
  }

  async function loadFeaturedEvents() {
    try {
      const response = await fetch('./featured-events.json', {
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const events = Array.isArray(data.events) ? data.events : [];
      const today = easternDateKey();

      const upcoming = [];
      const past = [];

      events.forEach(event => {
        if (!event || !event.title) return;

        const status =
          event.date && /^\d{4}-\d{2}-\d{2}$/.test(event.date)
            ? (event.date >= today ? 'upcoming' : 'past')
            : (event.status === 'upcoming' ? 'upcoming' : 'past');

        (status === 'upcoming' ? upcoming : past).push(event);
      });

      upcoming.sort((a, b) =>
        (a.date || '9999').localeCompare(b.date || '9999')
      );

      past.sort((a, b) =>
        (b.date || '').localeCompare(a.date || '')
      );

      upcomingContainer.replaceChildren();
      pastContainer.replaceChildren();

      for (const event of upcoming) {
        upcomingContainer.appendChild(renderCard(event, 'upcoming'));
      }

      for (const event of past) {
        pastContainer.appendChild(renderCard(event, 'past'));
      }

      if (!upcoming.length) {
        addText(
          upcomingContainer,
          'p',
          'empty-events-message',
          'Please check back for upcoming events.'
        );
      }

      if (!past.length) {
        addText(
          pastContainer,
          'p',
          'empty-events-message',
          'Past event highlights will appear here.'
        );
      }
    } catch (error) {
      console.error('Featured events could not be loaded:', error);

      upcomingContainer.replaceChildren();
      pastContainer.replaceChildren();

      addText(
        upcomingContainer,
        'p',
        'empty-events-message',
        'Featured events are temporarily unavailable.'
      );
    }
  }

  loadFeaturedEvents();
})();

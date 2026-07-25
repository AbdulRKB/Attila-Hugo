/* ============================================================
   Attila Hugo Theme - JavaScript
   ============================================================ */

(function() {
    'use strict';

    // --- Theme Toggle ---
    var themeToggle = document.getElementById('theme-toggle');
    var themeLabel = document.getElementById('theme-label');

    function getStoredTheme() {
        return localStorage.getItem('attila_theme') || 'system';
    }

    function applyTheme(theme) {
        var html = document.documentElement;
        html.classList.remove('theme-dark', 'theme-light');
        if (theme === 'dark') {
            html.classList.add('theme-dark');
        } else if (theme === 'light') {
            html.classList.add('theme-light');
        }
        if (themeLabel) {
            var label = theme.charAt(0).toUpperCase() + theme.slice(1);
            themeLabel.textContent = label;
        }
    }

    function cycleTheme() {
        var current = getStoredTheme();
        var next;
        if (current === 'system') {
            next = 'dark';
        } else if (current === 'dark') {
            next = 'light';
        } else {
            next = 'system';
        }
        localStorage.setItem('attila_theme', next);
        applyTheme(next);
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', function(e) {
            e.preventDefault();
            cycleTheme();
        });
    }

    // Apply stored theme on load
    applyTheme(getStoredTheme());

    // --- Reading Progress Bar ---
    var progressBar = document.querySelector('.progress-bar');
    var postContent = document.querySelector('.post-content');
    if (progressBar && postContent) {
        window.addEventListener('scroll', function() {
            var contentTop = postContent.getBoundingClientRect().top + window.scrollY;
            var contentHeight = postContent.offsetHeight;
            var windowHeight = window.innerHeight;
            
            // The scroll position where the bottom of the content touches the bottom of the window
            var maxScroll = contentTop + contentHeight - windowHeight;
            
            var progress = 0;
            if (maxScroll > 0) {
                progress = (window.scrollY / maxScroll) * 100;
            } else {
                progress = 100;
            }
            
            if (progress < 0) progress = 0;
            if (progress > 100) progress = 100;
            
            progressBar.style.width = progress + '%';
        });
    }

    // --- Parallax Cover ---
    var coverImages = document.querySelectorAll('.blog-cover img, .post-cover img');
    if (coverImages.length > 0) {
        window.addEventListener('scroll', function() {
            var scrolled = window.scrollY || document.documentElement.scrollTop;
            if (scrolled < window.innerHeight) {
                for (var i = 0; i < coverImages.length; i++) {
                    coverImages[i].style.transform = 'translate3d(0, ' + (scrolled * 0.3) + 'px, 0)';
                }
            }
        });
    }

    // --- Search Overlay ---
    var searchBtn = document.getElementById('search-btn');
    var searchOverlay = document.getElementById('search-overlay');
    var searchClose = document.getElementById('search-close');
    var searchInput = document.getElementById('search-input');
    var searchResults = document.getElementById('search-results');
    var searchIndex = null;

    function loadSearchIndex(callback) {
        if (searchIndex) { callback(); return; }
        var xhr = new XMLHttpRequest();
        xhr.open('GET', '/index.json');
        xhr.onload = function() {
            if (xhr.status === 200) {
                try {
                    var raw = JSON.parse(xhr.responseText);
                    var el = document.createElement('textarea');
                    searchIndex = raw.map(function(post) {
                        el.innerHTML = post.content;
                        var cleanContent = el.textContent || el.innerText || '';
                        el.innerHTML = post.description;
                        var cleanDesc = el.textContent || el.innerText || '';
                        el.innerHTML = post.title;
                        var cleanTitle = el.textContent || el.innerText || '';
                        return {
                            title: cleanTitle,
                            url: post.url,
                            content: cleanContent,
                            description: cleanDesc,
                            date: post.date
                        };
                    });
                } catch(e) { searchIndex = []; }
            } else {
                searchIndex = [];
            }
            callback();
        };
        xhr.onerror = function() { searchIndex = []; callback(); };
        xhr.send();
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    function highlightMatch(text, query) {
        if (!query) return escapeHtml(text);
        var escaped = escapeHtml(text);
        var regex = new RegExp('(' + query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
        return escaped.replace(regex, '<mark>$1</mark>');
    }

    function getSnippet(content, query, length) {
        length = length || 80;
        var lower = content.toLowerCase();
        var idx = lower.indexOf(query.toLowerCase());
        if (idx === -1) return content.substring(0, length) + '...';
        var start = Math.max(0, idx - 30);
        var end = Math.min(content.length, idx + length);
        var snippet = '';
        if (start > 0) snippet += '...';
        snippet += content.substring(start, end);
        if (end < content.length) snippet += '...';
        return snippet;
    }

    function performSearch(query) {
        if (!searchResults) return;
        if (!query || query.length < 2) {
            searchResults.innerHTML = '';
            searchResults.classList.remove('has-results');
            return;
        }
        var q = query.toLowerCase();
        var matches = [];
        for (var i = 0; i < searchIndex.length; i++) {
            var post = searchIndex[i];
            var titleMatch = post.title.toLowerCase().indexOf(q) !== -1;
            var contentMatch = post.content.toLowerCase().indexOf(q) !== -1;
            if (titleMatch || contentMatch) {
                matches.push(post);
            }
        }
        if (matches.length === 0) {
            searchResults.innerHTML = '';
            searchResults.classList.remove('has-results');
            return;
        }
        var html = '<div class="search-results-heading">Posts</div>';
        for (var j = 0; j < matches.length; j++) {
            var m = matches[j];
            var snippet = getSnippet(m.content, query, 80);
            html += '<a class="search-result-item" href="' + m.url + '">';
            html += '<div class="search-result-title">' + highlightMatch(m.title, query) + '</div>';
            html += '<div class="search-result-excerpt">' + highlightMatch(snippet, query) + '</div>';
            html += '</a>';
        }
        searchResults.innerHTML = html;
        searchResults.classList.add('has-results');
    }

    function openSearch() {
        if (!searchOverlay) return;
        loadSearchIndex(function() {
            searchOverlay.classList.add('active');
            if (searchInput) {
                searchInput.value = '';
                setTimeout(function() { searchInput.focus(); }, 100);
            }
            if (searchResults) {
                searchResults.innerHTML = '';
                searchResults.classList.remove('has-results');
            }
        });
    }

    function closeSearch() {
        if (!searchOverlay) return;
        searchOverlay.classList.remove('active');
        if (searchInput) searchInput.value = '';
        if (searchResults) {
            searchResults.innerHTML = '';
            searchResults.classList.remove('has-results');
        }
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openSearch();
        });
    }

    if (searchClose) {
        searchClose.addEventListener('click', function(e) {
            e.preventDefault();
            closeSearch();
        });
    }

    if (searchOverlay) {
        searchOverlay.addEventListener('click', function(e) {
            if (e.target === searchOverlay) {
                closeSearch();
            }
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && searchOverlay.classList.contains('active')) {
                closeSearch();
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', function() {
            performSearch(this.value);
        });
    }

})();

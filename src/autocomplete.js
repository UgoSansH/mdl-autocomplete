(function() {
    "use strict";

    if (typeof Ugosansh == "undefined") {
        window.Ugosansh = {};
    }

    if (typeof Ugosansh.Autocomplete == "undefined") {
        Ugosansh.Autocomplete = {};
    }


    Ugosansh.Autocomplete.Component = function(inputElement, configs)
    {
        this.container   = null;
        this.input       = null;
        this.listElement = null;
        this.onSearch    = false;
        this.pending     = null;
        this.entities    = new Array();
        this.listeners   = new Array();
        this.hasSecondary = false;

        this.preselected = null;
        this.config      = {
            path:  "/search",
            query: "search",
            headers: {},
            minchar: 2,
            avatar_size: 34
        };

        if (configs) {
            for (var key in configs) {
                if (this.config.hasOwnProperty(key)) {
                    this.config[key] = configs[key];
                }
            }
        }

        if (typeof inputElement == "string") {
            this.input = document.querySelector(inputElement);
        }

        if (!this.input) {
            throw "Not found search input";
        }

        this.renderComponent();
        this.bind();
    };


    Ugosansh.Autocomplete.Component.prototype.CssClasses_ = {
        CONTAINER: 'mdl-autocomplete',
        LIST:      'mdl-autocomplete__list',
        ITEM:      'mdl-autocomplete__item',
        PRIMARY:   'mdl-autocomplete__item--primary',
        CONTENT:   'mdl-autocomplete__item--content',
        SECONDARY: 'mdl-autocomplete__item--secondary',
        AVATAR:    'mdl-autocomplete__item--avatar',

        IS_VISIBLE:  'is-visible',
        IS_SELECTED: 'is-selected'
    };



    Ugosansh.Autocomplete.Component.prototype.bind = function()
    {
        document.addEventListener('keydown', this.onKeyboard.bind(this));
        document.addEventListener('click', this.onDocument.bind(this));

        this.input.addEventListener('keyup', this.onSearchChange.bind(this));
    };


    Ugosansh.Autocomplete.Component.prototype.bindItem = function(item)
    {
        item.addEventListener('click', this.onSelectItem.bind(this));
    };


    Ugosansh.Autocomplete.Component.prototype.getUrl = function(search)
    {
        return this.config.path +'?'+ this.config.query +'='+ search;
    };


    Ugosansh.Autocomplete.Component.prototype.onChange = function(listener)
    {
        this.listeners.push(listener);
    };


    Ugosansh.Autocomplete.Component.prototype.emit = function(entity)
    {
        for (var i = 0; i < this.listeners.length; i++) {
            var listener = this.listeners[i];

            listener(entity);
        }
    };


    Ugosansh.Autocomplete.Component.prototype.onSearchChange = function(event)
    {
        var search  = this.input.value;

        this.preselected = 0;
        this.updateSelected();

        if (search.length >= this.config.minchar) {
            var self    = this,
                url     = this.getUrl(search),
                request = new Ugosansh.Autocomplete.Request()
            ;

            request.get(url, this.config.headers)
                .then(function(response) {
                    var items = response.json();

                    if (items.length) {
                        self.refreshList(items);
                        self.open();
                    } else {
                        self.close();
                    }
                })
                .catch(function(response) {
                    console.error(response);
                })
            ;
        } else {
            this.close();
        }
    };


    Ugosansh.Autocomplete.Component.prototype.onKeyboard = function(event)
    {
        var keyCode = event.keyCode;

        if (this.isOpen()) {
            if (keyCode == 40) {
                // ArrowDown
                this.onArrowDown(event);
            } else if (keyCode == 38) {
                // ArrowUp
                this.onArrowUp(event);
            } else if (keyCode == 13) {
                // Enter
                this.onEnter(event);
            }
        }
    };


    Ugosansh.Autocomplete.Component.prototype.onDocument = function(event)
    {
        if ((event.target.isOutside(this.container)) && (event.target.isOutside(this.listElement))) {
            this.close();
        }
    };


    Ugosansh.Autocomplete.Component.prototype.selectItem = function(item)
    {
        var entity = this.find(item.dataset.id);

        if (entity) {
            this.input.value = entity.name;
            this.close();

            this.emit(entity);
        }
    };


    Ugosansh.Autocomplete.Component.prototype.onSelectItem = function(event)
    {
        var item = event.target;

        if (!item.classList.contains(this.CssClasses_.ITEM)) {
            item = item.parents('.'+ this.CssClasses_.ITEM);
        }

        this.selectItem(item);
    };

    Ugosansh.Autocomplete.Component.prototype.updateSelected = function()
    {
        var selected = this.listElement.querySelector('.'+ this.CssClasses_.ITEM +'.'+ this.CssClasses_.IS_SELECTED);

        if (selected) {
            selected.classList.remove(this.CssClasses_.IS_SELECTED);
        }


        if (this.preselected) {
            var item = this.listElement.querySelector('.'+ this.CssClasses_.ITEM +'[data-key="'+ this.preselected +'"]');

            if (item) {
                this.input.blur();
                item.focus();
                item.classList.add(this.CssClasses_.IS_SELECTED);
            }
        }
    };

    Ugosansh.Autocomplete.Component.prototype.onArrowUp = function(event)
    {
        if (!this.preselected) {
            this.preselected = 1;
        } else {
            if (this.preselected > 1) {
                this.preselected--;
            }
        }

        this.updateSelected();
    };


    Ugosansh.Autocomplete.Component.prototype.onArrowDown = function(event)
    {
        if (!this.preselected) {
            this.preselected = 1;
        } else {
            var length = this.listElement.querySelectorAll('.'+ this.CssClasses_.ITEM).length;

            if (this.preselected < length) {
                this.preselected++;
            }
        }

        this.updateSelected();
    };


    Ugosansh.Autocomplete.Component.prototype.onEnter = function(event)
    {
        if (this.isOpen()) {
            if (this.preselected) {
                var item = this.listElement.querySelector('.'+ this.CssClasses_.ITEM +'[data-key="'+ this.preselected +'"]');

                if (item) {
                    this.selectItem(item);
                }
            }

            event.preventDefault();
        }
    };


    Ugosansh.Autocomplete.Component.prototype.open = function(event)
    {
        this.listElement.classList.add(this.CssClasses_.IS_VISIBLE);
    };


    Ugosansh.Autocomplete.Component.prototype.close = function(event)
    {
        this.clearList();
        this.listElement.classList.remove(this.CssClasses_.IS_VISIBLE);
    };


    Ugosansh.Autocomplete.Component.prototype.isOpen = function()
    {
        return this.listElement.classList.contains(this.CssClasses_.IS_VISIBLE);
    };


    Ugosansh.Autocomplete.Component.prototype.renderComponent = function()
    {
        if (!this.container) {
            this.container = this.input.parentNode;

            if (!this.container.classList.contains(this.CssClasses_.CONTAINER)) {
                this.container.classList.add(this.CssClasses_.CONTAINER);
            }
        }

        this.renderList();
    };


    Ugosansh.Autocomplete.Component.prototype.renderList = function()
    {
        if (!this.listElement) {
            this.listElement = document.createElement('div');
            this.listElement.classList.add(this.CssClasses_.LIST);

            this.container.appendChild(this.listElement);
        }
    };


    Ugosansh.Autocomplete.Component.prototype.refreshList = function(entities)
    {
        this.clearList();
        this.configureList(entities);

        this.entities = entities;

        for (var i = 0; i < entities.length; i++) {
            var item = this.renderItem(entities[i], i + 1);

            this.listElement.appendChild(item);
            this.bindItem(item);
        }
    };


    Ugosansh.Autocomplete.Component.prototype.configureList = function(entities)
    {
        this.hasSecondary = false;

        for (var i = 0; i < entities.length; i++) {
            if (!this.hasSecondary) {
                if (typeof entities[i].image != "undefined") {
                    this.hasSecondary = true;
                }
            }
        }
    }

    Ugosansh.Autocomplete.Component.prototype.clearList = function()
    {
        while (this.listElement.hasChildNodes()) {
            this.listElement.removeChild(this.listElement.lastChild);
        }
    };


    Ugosansh.Autocomplete.Component.prototype.renderItem = function(entity, key)
    {
        var item    = document.createElement('div'),
            primary = document.createElement('div'),
            title   = document.createElement('div')
        ;

        item.classList.add(this.CssClasses_.ITEM);
        primary.classList.add(this.CssClasses_.PRIMARY);
        title.classList.add(this.CssClasses_.TITLE);

        item.dataset.key = key;
        item.dataset.id  = entity.id;

        title.appendChild(document.createTextNode(entity.name));
        primary.appendChild(title);

        if (typeof entity.content != "undefined") {
            var content = document.createElement('div');

            content.classList.add(this.CssClasses_.CONTENT);
            content.innerHTML = entity.content;

            primary.appendChild(content);
        }

        if (typeof entity.image != "undefined") {
            this.hasSecondary = true;

            var secondary = document.createElement('div'),
                avatar   = document.createElement('img')
            ;

            secondary.classList.add(this.CssClasses_.SECONDARY);
            avatar.classList.add(this.CssClasses_.AVATAR);

            avatar.src = entity.image;
            avatar.alt = entity.name;
            avatar.width = this.config.avatar_size;
            avatar.height = this.config.avatar_size;

            secondary.appendChild(avatar);

            item.appendChild(secondary);
        } else if (this.hasSecondary) {
            var secondary = document.createElement('div');

            secondary.classList.add(this.CssClasses_.SECONDARY);
            secondary.style.width = ""+ this.config.avatar_size +"px";

            item.appendChild(secondary);
        }

        item.appendChild(primary);

        return item;
    };


    Ugosansh.Autocomplete.Component.prototype.find = function(id)
    {
        for (var i = 0; i < this.entities.length; i++) {
            if (this.entities[i].id == id) {
                return this.entities[i];
            }
        }

        return null;
    };

})();

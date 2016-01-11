"use strict";

/*

Example:

UIkit.component('alert', {

    webcomponent: true,

    props: {
        close: false
    },

    created: function () {
        console.log('created');
    },

    attached: function () {
        console.log('attached');
        console.log(this.$el);
        console.log(this.close);
    },

    detached: function () {}

});

*/


import $ from './dom';
import $support from './support';
import $util from './util';
import polyfill from 'document-register-element';


let collection = {};
let components = {};

let registerElement = function(name, def) {

    var webcomponent = $.extend({
        prototype: Object.create(HTMLElement.prototype),
        tag: name
    }, def);

    if (typeof(webcomponent.prototype) == 'string') {
        webcomponent.prototype = Object.create(window[webcomponent.prototype]);
    }

    $util.extend(webcomponent.prototype, {

        attachedCallback: function(){
            collection[name](this, $util.attributes(this)); // attached is called in the constructor
        },
        detachedCallback(){
            collection[name](this).detached();
        },
        attributeChangedCallback(){
            collection[name](this).attributeChanged.apply(this, arguments);
        }
    });

    document.registerElement('uk-'+webcomponent.tag, { prototype: webcomponent.prototype});
};


function register(name, def) {

    var fn = function(element, options) {

        let $this = this;

        this.$el   = $(element).data(name, this);
        this.$opts = $.extend(true, {}, this.props, options);

        Object.keys(this.props).forEach(prop => {
            $this[prop] = $this.$opts[prop];
        });

        this.created();
        this.attached();
        this.init();

        this.$trigger('init.uk.component', [name, this]);

        return this;
    };

    $.extend(true, fn.prototype, {

        props:{},

        init(){},

        // triggerd as webcomponent
        attached(){},
        created(){},
        detached(){},
        attributeChanged: function(){},

        $on(a1,a2,a3) {
            return $(this.$el || this).on(a1,a2,a3);
        },

        $one(a1,a2,a3) {
            return $(this.$el || this).one(a1,a2,a3);
        },

        $off(evt) {
            return $(this.$el || this).off(evt);
        },

        $trigger(evt, params) {
            return $(this.$el || this).trigger(evt, params);
        },

        $find(selector) {
            return $(this.$el ? this.$el: []).find(selector);
        },

        $proxy(obj, methods) {

            let $this = this;

            methods.split(' ').forEach(method => {
                if (!$this[method]) $this[method] = function() { return obj[method].apply(obj, arguments); };
            });
        },

        $mixin(obj, methods) {

            let $this = this;

            methods.split(' ').forEach(method => {
                if (!$this[method]) $this[method] = obj[method].bind($this);
            });
        }

    }, def);

    components[name] = fn;
    collection[name] = function(element, options) {

        element = $(element);

        element.each(idx => {
            if (!$(element).data(name)) {
                return (new fn(element, options));
            }
        });

        return element.eq(0).data(name);
    };

    if (def.webcomponent) {
        registerElement(name, def.webcomponent);
    }

    return fn;
};

exports.components = components;

export default function(container) {

    if (container) {
        collection = container;
    }

    return register;
};

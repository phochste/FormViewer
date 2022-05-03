
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop$1() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert$1(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text$1(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text$1(' ');
    }
    function empty$1() {
        return text$1('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr$1(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_custom_element_data(node, prop, value) {
        if (prop in node) {
            node[prop] = typeof node[prop] === 'boolean' && value === '' ? true : value;
        }
        else {
            attr$1(node, prop, value);
        }
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init$1(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop$1,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop$1;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.47.0' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert$1(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr$1(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /*
     * Copyright (c) 2016-2021 Digital Bazaar, Inc. All rights reserved.
     */

    var IdentifierIssuer_1 = class IdentifierIssuer {
      /**
       * Creates a new IdentifierIssuer. A IdentifierIssuer issues unique
       * identifiers, keeping track of any previously issued identifiers.
       *
       * @param prefix the prefix to use ('<prefix><counter>').
       * @param existing an existing Map to use.
       * @param counter the counter to use.
       */
      constructor(prefix, existing = new Map(), counter = 0) {
        this.prefix = prefix;
        this._existing = existing;
        this.counter = counter;
      }

      /**
       * Copies this IdentifierIssuer.
       *
       * @return a copy of this IdentifierIssuer.
       */
      clone() {
        const {prefix, _existing, counter} = this;
        return new IdentifierIssuer(prefix, new Map(_existing), counter);
      }

      /**
       * Gets the new identifier for the given old identifier, where if no old
       * identifier is given a new identifier will be generated.
       *
       * @param [old] the old identifier to get the new identifier for.
       *
       * @return the new identifier.
       */
      getId(old) {
        // return existing old identifier
        const existing = old && this._existing.get(old);
        if(existing) {
          return existing;
        }

        // get next identifier
        const identifier = this.prefix + this.counter;
        this.counter++;

        // save mapping
        if(old) {
          this._existing.set(old, identifier);
        }

        return identifier;
      }

      /**
       * Returns true if the given old identifer has already been assigned a new
       * identifier.
       *
       * @param old the old identifier to check.
       *
       * @return true if the old identifier has been assigned a new identifier,
       *   false if not.
       */
      hasId(old) {
        return this._existing.has(old);
      }

      /**
       * Returns all of the IDs that have been issued new IDs in the order in
       * which they were issued new IDs.
       *
       * @return the list of old IDs that has been issued new IDs in order.
       */
      getOldIds() {
        return [...this._existing.keys()];
      }
    };

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function getAugmentedNamespace(n) {
    	if (n.__esModule) return n;
    	var a = Object.defineProperty({}, '__esModule', {value: true});
    	Object.keys(n).forEach(function (k) {
    		var d = Object.getOwnPropertyDescriptor(n, k);
    		Object.defineProperty(a, k, d.get ? d : {
    			enumerable: true,
    			get: function () {
    				return n[k];
    			}
    		});
    	});
    	return a;
    }

    (function (global, undefined$1) {

        if (global.setImmediate) {
            return;
        }

        var nextHandle = 1; // Spec says greater than zero
        var tasksByHandle = {};
        var currentlyRunningATask = false;
        var doc = global.document;
        var registerImmediate;

        function setImmediate(callback) {
          // Callback can either be a function or a string
          if (typeof callback !== "function") {
            callback = new Function("" + callback);
          }
          // Copy function arguments
          var args = new Array(arguments.length - 1);
          for (var i = 0; i < args.length; i++) {
              args[i] = arguments[i + 1];
          }
          // Store and register the task
          var task = { callback: callback, args: args };
          tasksByHandle[nextHandle] = task;
          registerImmediate(nextHandle);
          return nextHandle++;
        }

        function clearImmediate(handle) {
            delete tasksByHandle[handle];
        }

        function run(task) {
            var callback = task.callback;
            var args = task.args;
            switch (args.length) {
            case 0:
                callback();
                break;
            case 1:
                callback(args[0]);
                break;
            case 2:
                callback(args[0], args[1]);
                break;
            case 3:
                callback(args[0], args[1], args[2]);
                break;
            default:
                callback.apply(undefined$1, args);
                break;
            }
        }

        function runIfPresent(handle) {
            // From the spec: "Wait until any invocations of this algorithm started before this one have completed."
            // So if we're currently running a task, we'll need to delay this invocation.
            if (currentlyRunningATask) {
                // Delay by doing a setTimeout. setImmediate was tried instead, but in Firefox 7 it generated a
                // "too much recursion" error.
                setTimeout(runIfPresent, 0, handle);
            } else {
                var task = tasksByHandle[handle];
                if (task) {
                    currentlyRunningATask = true;
                    try {
                        run(task);
                    } finally {
                        clearImmediate(handle);
                        currentlyRunningATask = false;
                    }
                }
            }
        }

        function installNextTickImplementation() {
            registerImmediate = function(handle) {
                process.nextTick(function () { runIfPresent(handle); });
            };
        }

        function canUsePostMessage() {
            // The test against `importScripts` prevents this implementation from being installed inside a web worker,
            // where `global.postMessage` means something completely different and can't be used for this purpose.
            if (global.postMessage && !global.importScripts) {
                var postMessageIsAsynchronous = true;
                var oldOnMessage = global.onmessage;
                global.onmessage = function() {
                    postMessageIsAsynchronous = false;
                };
                global.postMessage("", "*");
                global.onmessage = oldOnMessage;
                return postMessageIsAsynchronous;
            }
        }

        function installPostMessageImplementation() {
            // Installs an event handler on `global` for the `message` event: see
            // * https://developer.mozilla.org/en/DOM/window.postMessage
            // * http://www.whatwg.org/specs/web-apps/current-work/multipage/comms.html#crossDocumentMessages

            var messagePrefix = "setImmediate$" + Math.random() + "$";
            var onGlobalMessage = function(event) {
                if (event.source === global &&
                    typeof event.data === "string" &&
                    event.data.indexOf(messagePrefix) === 0) {
                    runIfPresent(+event.data.slice(messagePrefix.length));
                }
            };

            if (global.addEventListener) {
                global.addEventListener("message", onGlobalMessage, false);
            } else {
                global.attachEvent("onmessage", onGlobalMessage);
            }

            registerImmediate = function(handle) {
                global.postMessage(messagePrefix + handle, "*");
            };
        }

        function installMessageChannelImplementation() {
            var channel = new MessageChannel();
            channel.port1.onmessage = function(event) {
                var handle = event.data;
                runIfPresent(handle);
            };

            registerImmediate = function(handle) {
                channel.port2.postMessage(handle);
            };
        }

        function installReadyStateChangeImplementation() {
            var html = doc.documentElement;
            registerImmediate = function(handle) {
                // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
                // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
                var script = doc.createElement("script");
                script.onreadystatechange = function () {
                    runIfPresent(handle);
                    script.onreadystatechange = null;
                    html.removeChild(script);
                    script = null;
                };
                html.appendChild(script);
            };
        }

        function installSetTimeoutImplementation() {
            registerImmediate = function(handle) {
                setTimeout(runIfPresent, 0, handle);
            };
        }

        // If supported, we should attach to the prototype of global, since that is where setTimeout et al. live.
        var attachTo = Object.getPrototypeOf && Object.getPrototypeOf(global);
        attachTo = attachTo && attachTo.setTimeout ? attachTo : global;

        // Don't get fooled by e.g. browserify environments.
        if ({}.toString.call(global.process) === "[object process]") {
            // For Node.js before 0.9
            installNextTickImplementation();

        } else if (canUsePostMessage()) {
            // For non-IE10 modern browsers
            installPostMessageImplementation();

        } else if (global.MessageChannel) {
            // For web workers, where supported
            installMessageChannelImplementation();

        } else if (doc && "onreadystatechange" in doc.createElement("script")) {
            // For IE 6–8
            installReadyStateChangeImplementation();

        } else {
            // For older browsers
            installSetTimeoutImplementation();
        }

        attachTo.setImmediate = setImmediate;
        attachTo.clearImmediate = clearImmediate;
    }(typeof self === "undefined" ? typeof commonjsGlobal === "undefined" ? commonjsGlobal : commonjsGlobal : self));

    /*
     * Copyright (c) 2016-2021 Digital Bazaar, Inc. All rights reserved.
     */



    const crypto$1 = self.crypto || self.msCrypto;

    // TODO: synchronous version no longer supported in browser

    var MessageDigestBrowser = class MessageDigest {
      /**
       * Creates a new MessageDigest.
       *
       * @param algorithm the algorithm to use.
       */
      constructor(algorithm) {
        // check if crypto.subtle is available
        // check is here rather than top-level to only fail if class is used
        if(!(crypto$1 && crypto$1.subtle)) {
          throw new Error('crypto.subtle not found.');
        }
        if(algorithm === 'sha256') {
          this.algorithm = {name: 'SHA-256'};
        } else if(algorithm === 'sha1') {
          this.algorithm = {name: 'SHA-1'};
        } else {
          throw new Error(`Unsupport algorithm "${algorithm}".`);
        }
        this._content = '';
      }

      update(msg) {
        this._content += msg;
      }

      async digest() {
        const data = new TextEncoder().encode(this._content);
        const buffer = new Uint8Array(
          await crypto$1.subtle.digest(this.algorithm, data));
        // return digest in hex
        let hex = '';
        for(let i = 0; i < buffer.length; ++i) {
          hex += buffer[i].toString(16).padStart(2, '0');
        }
        return hex;
      }
    };

    /*
     * Copyright (c) 2016-2021 Digital Bazaar, Inc. All rights reserved.
     */

    // TODO: convert to ES6 iterable?

    var Permuter_1 = class Permuter {
      /**
       * A Permuter iterates over all possible permutations of the given array
       * of elements.
       *
       * @param list the array of elements to iterate over.
       */
      constructor(list) {
        // original array
        this.current = list.sort();
        // indicates whether there are more permutations
        this.done = false;
        // directional info for permutation algorithm
        this.dir = new Map();
        for(let i = 0; i < list.length; ++i) {
          this.dir.set(list[i], true);
        }
      }

      /**
       * Returns true if there is another permutation.
       *
       * @return true if there is another permutation, false if not.
       */
      hasNext() {
        return !this.done;
      }

      /**
       * Gets the next permutation. Call hasNext() to ensure there is another one
       * first.
       *
       * @return the next permutation.
       */
      next() {
        // copy current permutation to return it
        const {current, dir} = this;
        const rval = current.slice();

        /* Calculate the next permutation using the Steinhaus-Johnson-Trotter
         permutation algorithm. */

        // get largest mobile element k
        // (mobile: element is greater than the one it is looking at)
        let k = null;
        let pos = 0;
        const length = current.length;
        for(let i = 0; i < length; ++i) {
          const element = current[i];
          const left = dir.get(element);
          if((k === null || element > k) &&
            ((left && i > 0 && element > current[i - 1]) ||
            (!left && i < (length - 1) && element > current[i + 1]))) {
            k = element;
            pos = i;
          }
        }

        // no more permutations
        if(k === null) {
          this.done = true;
        } else {
          // swap k and the element it is looking at
          const swap = dir.get(k) ? pos - 1 : pos + 1;
          current[pos] = current[swap];
          current[swap] = k;

          // reverse the direction of all elements larger than k
          for(const element of current) {
            if(element > k) {
              dir.set(element, !dir.get(element));
            }
          }
        }

        return rval;
      }
    };

    /*
     * Copyright (c) 2016-2021 Digital Bazaar, Inc. All rights reserved.
     */
    const RDF$1 = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
    const RDF_LANGSTRING$1 = RDF$1 + 'langString';
    const XSD_STRING$2 = 'http://www.w3.org/2001/XMLSchema#string';

    const TYPE_NAMED_NODE = 'NamedNode';
    const TYPE_BLANK_NODE = 'BlankNode';
    const TYPE_LITERAL = 'Literal';
    const TYPE_DEFAULT_GRAPH = 'DefaultGraph';

    // build regexes
    const REGEX = {};
    (() => {
      const iri = '(?:<([^:]+:[^>]*)>)';
      // https://www.w3.org/TR/turtle/#grammar-production-BLANK_NODE_LABEL
      const PN_CHARS_BASE =
        'A-Z' + 'a-z' +
        '\u00C0-\u00D6' +
        '\u00D8-\u00F6' +
        '\u00F8-\u02FF' +
        '\u0370-\u037D' +
        '\u037F-\u1FFF' +
        '\u200C-\u200D' +
        '\u2070-\u218F' +
        '\u2C00-\u2FEF' +
        '\u3001-\uD7FF' +
        '\uF900-\uFDCF' +
        '\uFDF0-\uFFFD';
        // TODO:
        //'\u10000-\uEFFFF';
      const PN_CHARS_U =
        PN_CHARS_BASE +
        '_';
      const PN_CHARS =
        PN_CHARS_U +
        '0-9' +
        '-' +
        '\u00B7' +
        '\u0300-\u036F' +
        '\u203F-\u2040';
      const BLANK_NODE_LABEL =
        '(_:' +
          '(?:[' + PN_CHARS_U + '0-9])' +
          '(?:(?:[' + PN_CHARS + '.])*(?:[' + PN_CHARS + ']))?' +
        ')';
      const bnode = BLANK_NODE_LABEL;
      const plain = '"([^"\\\\]*(?:\\\\.[^"\\\\]*)*)"';
      const datatype = '(?:\\^\\^' + iri + ')';
      const language = '(?:@([a-zA-Z]+(?:-[a-zA-Z0-9]+)*))';
      const literal = '(?:' + plain + '(?:' + datatype + '|' + language + ')?)';
      const ws = '[ \\t]+';
      const wso = '[ \\t]*';

      // define quad part regexes
      const subject = '(?:' + iri + '|' + bnode + ')' + ws;
      const property = iri + ws;
      const object = '(?:' + iri + '|' + bnode + '|' + literal + ')' + wso;
      const graphName = '(?:\\.|(?:(?:' + iri + '|' + bnode + ')' + wso + '\\.))';

      // end of line and empty regexes
      REGEX.eoln = /(?:\r\n)|(?:\n)|(?:\r)/g;
      REGEX.empty = new RegExp('^' + wso + '$');

      // full quad regex
      REGEX.quad = new RegExp(
        '^' + wso + subject + property + object + graphName + wso + '$');
    })();

    var NQuads_1 = class NQuads {
      /**
       * Parses RDF in the form of N-Quads.
       *
       * @param input the N-Quads input to parse.
       *
       * @return an RDF dataset (an array of quads per http://rdf.js.org/).
       */
      static parse(input) {
        // build RDF dataset
        const dataset = [];

        const graphs = {};

        // split N-Quad input into lines
        const lines = input.split(REGEX.eoln);
        let lineNumber = 0;
        for(const line of lines) {
          lineNumber++;

          // skip empty lines
          if(REGEX.empty.test(line)) {
            continue;
          }

          // parse quad
          const match = line.match(REGEX.quad);
          if(match === null) {
            throw new Error('N-Quads parse error on line ' + lineNumber + '.');
          }

          // create RDF quad
          const quad = {subject: null, predicate: null, object: null, graph: null};

          // get subject
          if(match[1] !== undefined) {
            quad.subject = {termType: TYPE_NAMED_NODE, value: match[1]};
          } else {
            quad.subject = {termType: TYPE_BLANK_NODE, value: match[2]};
          }

          // get predicate
          quad.predicate = {termType: TYPE_NAMED_NODE, value: match[3]};

          // get object
          if(match[4] !== undefined) {
            quad.object = {termType: TYPE_NAMED_NODE, value: match[4]};
          } else if(match[5] !== undefined) {
            quad.object = {termType: TYPE_BLANK_NODE, value: match[5]};
          } else {
            quad.object = {
              termType: TYPE_LITERAL,
              value: undefined,
              datatype: {
                termType: TYPE_NAMED_NODE
              }
            };
            if(match[7] !== undefined) {
              quad.object.datatype.value = match[7];
            } else if(match[8] !== undefined) {
              quad.object.datatype.value = RDF_LANGSTRING$1;
              quad.object.language = match[8];
            } else {
              quad.object.datatype.value = XSD_STRING$2;
            }
            quad.object.value = _unescape(match[6]);
          }

          // get graph
          if(match[9] !== undefined) {
            quad.graph = {
              termType: TYPE_NAMED_NODE,
              value: match[9]
            };
          } else if(match[10] !== undefined) {
            quad.graph = {
              termType: TYPE_BLANK_NODE,
              value: match[10]
            };
          } else {
            quad.graph = {
              termType: TYPE_DEFAULT_GRAPH,
              value: ''
            };
          }

          // only add quad if it is unique in its graph
          if(!(quad.graph.value in graphs)) {
            graphs[quad.graph.value] = [quad];
            dataset.push(quad);
          } else {
            let unique = true;
            const quads = graphs[quad.graph.value];
            for(const q of quads) {
              if(_compareTriples(q, quad)) {
                unique = false;
                break;
              }
            }
            if(unique) {
              quads.push(quad);
              dataset.push(quad);
            }
          }
        }

        return dataset;
      }

      /**
       * Converts an RDF dataset to N-Quads.
       *
       * @param dataset (array of quads) the RDF dataset to convert.
       *
       * @return the N-Quads string.
       */
      static serialize(dataset) {
        if(!Array.isArray(dataset)) {
          dataset = NQuads.legacyDatasetToQuads(dataset);
        }
        const quads = [];
        for(const quad of dataset) {
          quads.push(NQuads.serializeQuad(quad));
        }
        return quads.sort().join('');
      }

      /**
       * Converts an RDF quad to an N-Quad string (a single quad).
       *
       * @param quad the RDF quad convert.
       *
       * @return the N-Quad string.
       */
      static serializeQuad(quad) {
        const s = quad.subject;
        const p = quad.predicate;
        const o = quad.object;
        const g = quad.graph;

        let nquad = '';

        // subject can only be NamedNode or BlankNode
        if(s.termType === TYPE_NAMED_NODE) {
          nquad += `<${s.value}>`;
        } else {
          nquad += `${s.value}`;
        }

        // predicate can only be NamedNode
        nquad += ` <${p.value}> `;

        // object is NamedNode, BlankNode, or Literal
        if(o.termType === TYPE_NAMED_NODE) {
          nquad += `<${o.value}>`;
        } else if(o.termType === TYPE_BLANK_NODE) {
          nquad += o.value;
        } else {
          nquad += `"${_escape(o.value)}"`;
          if(o.datatype.value === RDF_LANGSTRING$1) {
            if(o.language) {
              nquad += `@${o.language}`;
            }
          } else if(o.datatype.value !== XSD_STRING$2) {
            nquad += `^^<${o.datatype.value}>`;
          }
        }

        // graph can only be NamedNode or BlankNode (or DefaultGraph, but that
        // does not add to `nquad`)
        if(g.termType === TYPE_NAMED_NODE) {
          nquad += ` <${g.value}>`;
        } else if(g.termType === TYPE_BLANK_NODE) {
          nquad += ` ${g.value}`;
        }

        nquad += ' .\n';
        return nquad;
      }

      /**
       * Converts a legacy-formatted dataset to an array of quads dataset per
       * http://rdf.js.org/.
       *
       * @param dataset the legacy dataset to convert.
       *
       * @return the array of quads dataset.
       */
      static legacyDatasetToQuads(dataset) {
        const quads = [];

        const termTypeMap = {
          'blank node': TYPE_BLANK_NODE,
          IRI: TYPE_NAMED_NODE,
          literal: TYPE_LITERAL
        };

        for(const graphName in dataset) {
          const triples = dataset[graphName];
          triples.forEach(triple => {
            const quad = {};
            for(const componentName in triple) {
              const oldComponent = triple[componentName];
              const newComponent = {
                termType: termTypeMap[oldComponent.type],
                value: oldComponent.value
              };
              if(newComponent.termType === TYPE_LITERAL) {
                newComponent.datatype = {
                  termType: TYPE_NAMED_NODE
                };
                if('datatype' in oldComponent) {
                  newComponent.datatype.value = oldComponent.datatype;
                }
                if('language' in oldComponent) {
                  if(!('datatype' in oldComponent)) {
                    newComponent.datatype.value = RDF_LANGSTRING$1;
                  }
                  newComponent.language = oldComponent.language;
                } else if(!('datatype' in oldComponent)) {
                  newComponent.datatype.value = XSD_STRING$2;
                }
              }
              quad[componentName] = newComponent;
            }
            if(graphName === '@default') {
              quad.graph = {
                termType: TYPE_DEFAULT_GRAPH,
                value: ''
              };
            } else {
              quad.graph = {
                termType: graphName.startsWith('_:') ?
                  TYPE_BLANK_NODE : TYPE_NAMED_NODE,
                value: graphName
              };
            }
            quads.push(quad);
          });
        }

        return quads;
      }
    };

    /**
     * Compares two RDF triples for equality.
     *
     * @param t1 the first triple.
     * @param t2 the second triple.
     *
     * @return true if the triples are the same, false if not.
     */
    function _compareTriples(t1, t2) {
      // compare subject and object types first as it is the quickest check
      if(!(t1.subject.termType === t2.subject.termType &&
        t1.object.termType === t2.object.termType)) {
        return false;
      }
      // compare values
      if(!(t1.subject.value === t2.subject.value &&
        t1.predicate.value === t2.predicate.value &&
        t1.object.value === t2.object.value)) {
        return false;
      }
      if(t1.object.termType !== TYPE_LITERAL) {
        // no `datatype` or `language` to check
        return true;
      }
      return (
        (t1.object.datatype.termType === t2.object.datatype.termType) &&
        (t1.object.language === t2.object.language) &&
        (t1.object.datatype.value === t2.object.datatype.value)
      );
    }

    const _escapeRegex = /["\\\n\r]/g;
    /**
     * Escape string to N-Quads literal
     */
    function _escape(s) {
      return s.replace(_escapeRegex, function(match) {
        switch(match) {
          case '"': return '\\"';
          case '\\': return '\\\\';
          case '\n': return '\\n';
          case '\r': return '\\r';
        }
      });
    }

    const _unescapeRegex =
      /(?:\\([tbnrf"'\\]))|(?:\\u([0-9A-Fa-f]{4}))|(?:\\U([0-9A-Fa-f]{8}))/g;
    /**
     * Unescape N-Quads literal to string
     */
    function _unescape(s) {
      return s.replace(_unescapeRegex, function(match, code, u, U) {
        if(code) {
          switch(code) {
            case 't': return '\t';
            case 'b': return '\b';
            case 'n': return '\n';
            case 'r': return '\r';
            case 'f': return '\f';
            case '"': return '"';
            case '\'': return '\'';
            case '\\': return '\\';
          }
        }
        if(u) {
          return String.fromCharCode(parseInt(u, 16));
        }
        if(U) {
          // FIXME: support larger values
          throw new Error('Unsupported U escape');
        }
      });
    }

    /*
     * Copyright (c) 2016-2021 Digital Bazaar, Inc. All rights reserved.
     */






    var URDNA2015_1 = class URDNA2015 {
      constructor() {
        this.name = 'URDNA2015';
        this.blankNodeInfo = new Map();
        this.canonicalIssuer = new IdentifierIssuer_1('_:c14n');
        this.hashAlgorithm = 'sha256';
        this.quads = null;
      }

      // 4.4) Normalization Algorithm
      async main(dataset) {
        this.quads = dataset;

        // 1) Create the normalization state.
        // 2) For every quad in input dataset:
        for(const quad of dataset) {
          // 2.1) For each blank node that occurs in the quad, add a reference
          // to the quad using the blank node identifier in the blank node to
          // quads map, creating a new entry if necessary.
          this._addBlankNodeQuadInfo({quad, component: quad.subject});
          this._addBlankNodeQuadInfo({quad, component: quad.object});
          this._addBlankNodeQuadInfo({quad, component: quad.graph});
        }

        // 3) Create a list of non-normalized blank node identifiers
        // non-normalized identifiers and populate it using the keys from the
        // blank node to quads map.
        // Note: We use a map here and it was generated during step 2.

        // 4) `simple` flag is skipped -- loop is optimized away. This optimization
        // is permitted because there was a typo in the hash first degree quads
        // algorithm in the URDNA2015 spec that was implemented widely making it
        // such that it could not be fixed; the result was that the loop only
        // needs to be run once and the first degree quad hashes will never change.
        // 5.1-5.2 are skipped; first degree quad hashes are generated just once
        // for all non-normalized blank nodes.

        // 5.3) For each blank node identifier identifier in non-normalized
        // identifiers:
        const hashToBlankNodes = new Map();
        const nonNormalized = [...this.blankNodeInfo.keys()];
        let i = 0;
        for(const id of nonNormalized) {
          // Note: batch hashing first degree quads 100 at a time
          if(++i % 100 === 0) {
            await this._yield();
          }
          // steps 5.3.1 and 5.3.2:
          await this._hashAndTrackBlankNode({id, hashToBlankNodes});
        }

        // 5.4) For each hash to identifier list mapping in hash to blank
        // nodes map, lexicographically-sorted by hash:
        const hashes = [...hashToBlankNodes.keys()].sort();
        // optimize away second sort, gather non-unique hashes in order as we go
        const nonUnique = [];
        for(const hash of hashes) {
          // 5.4.1) If the length of identifier list is greater than 1,
          // continue to the next mapping.
          const idList = hashToBlankNodes.get(hash);
          if(idList.length > 1) {
            nonUnique.push(idList);
            continue;
          }

          // 5.4.2) Use the Issue Identifier algorithm, passing canonical
          // issuer and the single blank node identifier in identifier
          // list, identifier, to issue a canonical replacement identifier
          // for identifier.
          const id = idList[0];
          this.canonicalIssuer.getId(id);

          // Note: These steps are skipped, optimized away since the loop
          // only needs to be run once.
          // 5.4.3) Remove identifier from non-normalized identifiers.
          // 5.4.4) Remove hash from the hash to blank nodes map.
          // 5.4.5) Set simple to true.
        }

        // 6) For each hash to identifier list mapping in hash to blank nodes map,
        // lexicographically-sorted by hash:
        // Note: sort optimized away, use `nonUnique`.
        for(const idList of nonUnique) {
          // 6.1) Create hash path list where each item will be a result of
          // running the Hash N-Degree Quads algorithm.
          const hashPathList = [];

          // 6.2) For each blank node identifier identifier in identifier list:
          for(const id of idList) {
            // 6.2.1) If a canonical identifier has already been issued for
            // identifier, continue to the next identifier.
            if(this.canonicalIssuer.hasId(id)) {
              continue;
            }

            // 6.2.2) Create temporary issuer, an identifier issuer
            // initialized with the prefix _:b.
            const issuer = new IdentifierIssuer_1('_:b');

            // 6.2.3) Use the Issue Identifier algorithm, passing temporary
            // issuer and identifier, to issue a new temporary blank node
            // identifier for identifier.
            issuer.getId(id);

            // 6.2.4) Run the Hash N-Degree Quads algorithm, passing
            // temporary issuer, and append the result to the hash path list.
            const result = await this.hashNDegreeQuads(id, issuer);
            hashPathList.push(result);
          }

          // 6.3) For each result in the hash path list,
          // lexicographically-sorted by the hash in result:
          hashPathList.sort(_stringHashCompare$1);
          for(const result of hashPathList) {
            // 6.3.1) For each blank node identifier, existing identifier,
            // that was issued a temporary identifier by identifier issuer
            // in result, issue a canonical identifier, in the same order,
            // using the Issue Identifier algorithm, passing canonical
            // issuer and existing identifier.
            const oldIds = result.issuer.getOldIds();
            for(const id of oldIds) {
              this.canonicalIssuer.getId(id);
            }
          }
        }

        /* Note: At this point all blank nodes in the set of RDF quads have been
        assigned canonical identifiers, which have been stored in the canonical
        issuer. Here each quad is updated by assigning each of its blank nodes
        its new identifier. */

        // 7) For each quad, quad, in input dataset:
        const normalized = [];
        for(const quad of this.quads) {
          // 7.1) Create a copy, quad copy, of quad and replace any existing
          // blank node identifiers using the canonical identifiers
          // previously issued by canonical issuer.
          // Note: We optimize with shallow copies here.
          const q = {...quad};
          q.subject = this._useCanonicalId({component: q.subject});
          q.object = this._useCanonicalId({component: q.object});
          q.graph = this._useCanonicalId({component: q.graph});
          // 7.2) Add quad copy to the normalized dataset.
          normalized.push(NQuads_1.serializeQuad(q));
        }

        // sort normalized output
        normalized.sort();

        // 8) Return the normalized dataset.
        return normalized.join('');
      }

      // 4.6) Hash First Degree Quads
      async hashFirstDegreeQuads(id) {
        // 1) Initialize nquads to an empty list. It will be used to store quads in
        // N-Quads format.
        const nquads = [];

        // 2) Get the list of quads `quads` associated with the reference blank node
        // identifier in the blank node to quads map.
        const info = this.blankNodeInfo.get(id);
        const quads = info.quads;

        // 3) For each quad `quad` in `quads`:
        for(const quad of quads) {
          // 3.1) Serialize the quad in N-Quads format with the following special
          // rule:

          // 3.1.1) If any component in quad is an blank node, then serialize it
          // using a special identifier as follows:
          const copy = {
            subject: null, predicate: quad.predicate, object: null, graph: null
          };
          // 3.1.2) If the blank node's existing blank node identifier matches
          // the reference blank node identifier then use the blank node
          // identifier _:a, otherwise, use the blank node identifier _:z.
          copy.subject = this.modifyFirstDegreeComponent(
            id, quad.subject, 'subject');
          copy.object = this.modifyFirstDegreeComponent(
            id, quad.object, 'object');
          copy.graph = this.modifyFirstDegreeComponent(
            id, quad.graph, 'graph');
          nquads.push(NQuads_1.serializeQuad(copy));
        }

        // 4) Sort nquads in lexicographical order.
        nquads.sort();

        // 5) Return the hash that results from passing the sorted, joined nquads
        // through the hash algorithm.
        const md = new MessageDigestBrowser(this.hashAlgorithm);
        for(const nquad of nquads) {
          md.update(nquad);
        }
        info.hash = await md.digest();
        return info.hash;
      }

      // 4.7) Hash Related Blank Node
      async hashRelatedBlankNode(related, quad, issuer, position) {
        // 1) Set the identifier to use for related, preferring first the canonical
        // identifier for related if issued, second the identifier issued by issuer
        // if issued, and last, if necessary, the result of the Hash First Degree
        // Quads algorithm, passing related.
        let id;
        if(this.canonicalIssuer.hasId(related)) {
          id = this.canonicalIssuer.getId(related);
        } else if(issuer.hasId(related)) {
          id = issuer.getId(related);
        } else {
          id = this.blankNodeInfo.get(related).hash;
        }

        // 2) Initialize a string input to the value of position.
        // Note: We use a hash object instead.
        const md = new MessageDigestBrowser(this.hashAlgorithm);
        md.update(position);

        // 3) If position is not g, append <, the value of the predicate in quad,
        // and > to input.
        if(position !== 'g') {
          md.update(this.getRelatedPredicate(quad));
        }

        // 4) Append identifier to input.
        md.update(id);

        // 5) Return the hash that results from passing input through the hash
        // algorithm.
        return md.digest();
      }

      // 4.8) Hash N-Degree Quads
      async hashNDegreeQuads(id, issuer) {
        // 1) Create a hash to related blank nodes map for storing hashes that
        // identify related blank nodes.
        // Note: 2) and 3) handled within `createHashToRelated`
        const md = new MessageDigestBrowser(this.hashAlgorithm);
        const hashToRelated = await this.createHashToRelated(id, issuer);

        // 4) Create an empty string, data to hash.
        // Note: We created a hash object `md` above instead.

        // 5) For each related hash to blank node list mapping in hash to related
        // blank nodes map, sorted lexicographically by related hash:
        const hashes = [...hashToRelated.keys()].sort();
        for(const hash of hashes) {
          // 5.1) Append the related hash to the data to hash.
          md.update(hash);

          // 5.2) Create a string chosen path.
          let chosenPath = '';

          // 5.3) Create an unset chosen issuer variable.
          let chosenIssuer;

          // 5.4) For each permutation of blank node list:
          const permuter = new Permuter_1(hashToRelated.get(hash));
          let i = 0;
          while(permuter.hasNext()) {
            const permutation = permuter.next();
            // Note: batch permutations 3 at a time
            if(++i % 3 === 0) {
              await this._yield();
            }

            // 5.4.1) Create a copy of issuer, issuer copy.
            let issuerCopy = issuer.clone();

            // 5.4.2) Create a string path.
            let path = '';

            // 5.4.3) Create a recursion list, to store blank node identifiers
            // that must be recursively processed by this algorithm.
            const recursionList = [];

            // 5.4.4) For each related in permutation:
            let nextPermutation = false;
            for(const related of permutation) {
              // 5.4.4.1) If a canonical identifier has been issued for
              // related, append it to path.
              if(this.canonicalIssuer.hasId(related)) {
                path += this.canonicalIssuer.getId(related);
              } else {
                // 5.4.4.2) Otherwise:
                // 5.4.4.2.1) If issuer copy has not issued an identifier for
                // related, append related to recursion list.
                if(!issuerCopy.hasId(related)) {
                  recursionList.push(related);
                }
                // 5.4.4.2.2) Use the Issue Identifier algorithm, passing
                // issuer copy and related and append the result to path.
                path += issuerCopy.getId(related);
              }

              // 5.4.4.3) If chosen path is not empty and the length of path
              // is greater than or equal to the length of chosen path and
              // path is lexicographically greater than chosen path, then
              // skip to the next permutation.
              // Note: Comparing path length to chosen path length can be optimized
              // away; only compare lexicographically.
              if(chosenPath.length !== 0 && path > chosenPath) {
                nextPermutation = true;
                break;
              }
            }

            if(nextPermutation) {
              continue;
            }

            // 5.4.5) For each related in recursion list:
            for(const related of recursionList) {
              // 5.4.5.1) Set result to the result of recursively executing
              // the Hash N-Degree Quads algorithm, passing related for
              // identifier and issuer copy for path identifier issuer.
              const result = await this.hashNDegreeQuads(related, issuerCopy);

              // 5.4.5.2) Use the Issue Identifier algorithm, passing issuer
              // copy and related and append the result to path.
              path += issuerCopy.getId(related);

              // 5.4.5.3) Append <, the hash in result, and > to path.
              path += `<${result.hash}>`;

              // 5.4.5.4) Set issuer copy to the identifier issuer in
              // result.
              issuerCopy = result.issuer;

              // 5.4.5.5) If chosen path is not empty and the length of path
              // is greater than or equal to the length of chosen path and
              // path is lexicographically greater than chosen path, then
              // skip to the next permutation.
              // Note: Comparing path length to chosen path length can be optimized
              // away; only compare lexicographically.
              if(chosenPath.length !== 0 && path > chosenPath) {
                nextPermutation = true;
                break;
              }
            }

            if(nextPermutation) {
              continue;
            }

            // 5.4.6) If chosen path is empty or path is lexicographically
            // less than chosen path, set chosen path to path and chosen
            // issuer to issuer copy.
            if(chosenPath.length === 0 || path < chosenPath) {
              chosenPath = path;
              chosenIssuer = issuerCopy;
            }
          }

          // 5.5) Append chosen path to data to hash.
          md.update(chosenPath);

          // 5.6) Replace issuer, by reference, with chosen issuer.
          issuer = chosenIssuer;
        }

        // 6) Return issuer and the hash that results from passing data to hash
        // through the hash algorithm.
        return {hash: await md.digest(), issuer};
      }

      // helper for modifying component during Hash First Degree Quads
      modifyFirstDegreeComponent(id, component) {
        if(component.termType !== 'BlankNode') {
          return component;
        }
        /* Note: A mistake in the URDNA2015 spec that made its way into
        implementations (and therefore must stay to avoid interop breakage)
        resulted in an assigned canonical ID, if available for
        `component.value`, not being used in place of `_:a`/`_:z`, so
        we don't use it here. */
        return {
          termType: 'BlankNode',
          value: component.value === id ? '_:a' : '_:z'
        };
      }

      // helper for getting a related predicate
      getRelatedPredicate(quad) {
        return `<${quad.predicate.value}>`;
      }

      // helper for creating hash to related blank nodes map
      async createHashToRelated(id, issuer) {
        // 1) Create a hash to related blank nodes map for storing hashes that
        // identify related blank nodes.
        const hashToRelated = new Map();

        // 2) Get a reference, quads, to the list of quads in the blank node to
        // quads map for the key identifier.
        const quads = this.blankNodeInfo.get(id).quads;

        // 3) For each quad in quads:
        let i = 0;
        for(const quad of quads) {
          // Note: batch hashing related blank node quads 100 at a time
          if(++i % 100 === 0) {
            await this._yield();
          }
          // 3.1) For each component in quad, if component is the subject, object,
          // and graph name and it is a blank node that is not identified by
          // identifier:
          // steps 3.1.1 and 3.1.2 occur in helpers:
          await Promise.all([
            this._addRelatedBlankNodeHash({
              quad, component: quad.subject, position: 's',
              id, issuer, hashToRelated
            }),
            this._addRelatedBlankNodeHash({
              quad, component: quad.object, position: 'o',
              id, issuer, hashToRelated
            }),
            this._addRelatedBlankNodeHash({
              quad, component: quad.graph, position: 'g',
              id, issuer, hashToRelated
            })
          ]);
        }

        return hashToRelated;
      }

      async _hashAndTrackBlankNode({id, hashToBlankNodes}) {
        // 5.3.1) Create a hash, hash, according to the Hash First Degree
        // Quads algorithm.
        const hash = await this.hashFirstDegreeQuads(id);

        // 5.3.2) Add hash and identifier to hash to blank nodes map,
        // creating a new entry if necessary.
        const idList = hashToBlankNodes.get(hash);
        if(!idList) {
          hashToBlankNodes.set(hash, [id]);
        } else {
          idList.push(id);
        }
      }

      _addBlankNodeQuadInfo({quad, component}) {
        if(component.termType !== 'BlankNode') {
          return;
        }
        const id = component.value;
        const info = this.blankNodeInfo.get(id);
        if(info) {
          info.quads.add(quad);
        } else {
          this.blankNodeInfo.set(id, {quads: new Set([quad]), hash: null});
        }
      }

      async _addRelatedBlankNodeHash(
        {quad, component, position, id, issuer, hashToRelated}) {
        if(!(component.termType === 'BlankNode' && component.value !== id)) {
          return;
        }
        // 3.1.1) Set hash to the result of the Hash Related Blank Node
        // algorithm, passing the blank node identifier for component as
        // related, quad, path identifier issuer as issuer, and position as
        // either s, o, or g based on whether component is a subject, object,
        // graph name, respectively.
        const related = component.value;
        const hash = await this.hashRelatedBlankNode(
          related, quad, issuer, position);

        // 3.1.2) Add a mapping of hash to the blank node identifier for
        // component to hash to related blank nodes map, adding an entry as
        // necessary.
        const entries = hashToRelated.get(hash);
        if(entries) {
          entries.push(related);
        } else {
          hashToRelated.set(hash, [related]);
        }
      }

      _useCanonicalId({component}) {
        if(component.termType === 'BlankNode' &&
          !component.value.startsWith(this.canonicalIssuer.prefix)) {
          return {
            termType: 'BlankNode',
            value: this.canonicalIssuer.getId(component.value)
          };
        }
        return component;
      }

      async _yield() {
        return new Promise(resolve => setImmediate(resolve));
      }
    };

    function _stringHashCompare$1(a, b) {
      return a.hash < b.hash ? -1 : a.hash > b.hash ? 1 : 0;
    }

    /*
     * Copyright (c) 2016-2021 Digital Bazaar, Inc. All rights reserved.
     */



    var URGNA2012 = class URDNA2012 extends URDNA2015_1 {
      constructor() {
        super();
        this.name = 'URGNA2012';
        this.hashAlgorithm = 'sha1';
      }

      // helper for modifying component during Hash First Degree Quads
      modifyFirstDegreeComponent(id, component, key) {
        if(component.termType !== 'BlankNode') {
          return component;
        }
        if(key === 'graph') {
          return {
            termType: 'BlankNode',
            value: '_:g'
          };
        }
        return {
          termType: 'BlankNode',
          value: (component.value === id ? '_:a' : '_:z')
        };
      }

      // helper for getting a related predicate
      getRelatedPredicate(quad) {
        return quad.predicate.value;
      }

      // helper for creating hash to related blank nodes map
      async createHashToRelated(id, issuer) {
        // 1) Create a hash to related blank nodes map for storing hashes that
        // identify related blank nodes.
        const hashToRelated = new Map();

        // 2) Get a reference, quads, to the list of quads in the blank node to
        // quads map for the key identifier.
        const quads = this.blankNodeInfo.get(id).quads;

        // 3) For each quad in quads:
        let i = 0;
        for(const quad of quads) {
          // 3.1) If the quad's subject is a blank node that does not match
          // identifier, set hash to the result of the Hash Related Blank Node
          // algorithm, passing the blank node identifier for subject as related,
          // quad, path identifier issuer as issuer, and p as position.
          let position;
          let related;
          if(quad.subject.termType === 'BlankNode' && quad.subject.value !== id) {
            related = quad.subject.value;
            position = 'p';
          } else if(
            quad.object.termType === 'BlankNode' && quad.object.value !== id) {
            // 3.2) Otherwise, if quad's object is a blank node that does not match
            // identifier, to the result of the Hash Related Blank Node algorithm,
            // passing the blank node identifier for object as related, quad, path
            // identifier issuer as issuer, and r as position.
            related = quad.object.value;
            position = 'r';
          } else {
            // 3.3) Otherwise, continue to the next quad.
            continue;
          }
          // Note: batch hashing related blank nodes 100 at a time
          if(++i % 100 === 0) {
            await this._yield();
          }
          // 3.4) Add a mapping of hash to the blank node identifier for the
          // component that matched (subject or object) to hash to related blank
          // nodes map, adding an entry as necessary.
          const hash = await this.hashRelatedBlankNode(
            related, quad, issuer, position);
          const entries = hashToRelated.get(hash);
          if(entries) {
            entries.push(related);
          } else {
            hashToRelated.set(hash, [related]);
          }
        }

        return hashToRelated;
      }
    };

    /*
     * Copyright (c) 2016-2021 Digital Bazaar, Inc. All rights reserved.
     */






    var URDNA2015Sync_1 = class URDNA2015Sync {
      constructor() {
        this.name = 'URDNA2015';
        this.blankNodeInfo = new Map();
        this.canonicalIssuer = new IdentifierIssuer_1('_:c14n');
        this.hashAlgorithm = 'sha256';
        this.quads = null;
      }

      // 4.4) Normalization Algorithm
      main(dataset) {
        this.quads = dataset;

        // 1) Create the normalization state.
        // 2) For every quad in input dataset:
        for(const quad of dataset) {
          // 2.1) For each blank node that occurs in the quad, add a reference
          // to the quad using the blank node identifier in the blank node to
          // quads map, creating a new entry if necessary.
          this._addBlankNodeQuadInfo({quad, component: quad.subject});
          this._addBlankNodeQuadInfo({quad, component: quad.object});
          this._addBlankNodeQuadInfo({quad, component: quad.graph});
        }

        // 3) Create a list of non-normalized blank node identifiers
        // non-normalized identifiers and populate it using the keys from the
        // blank node to quads map.
        // Note: We use a map here and it was generated during step 2.

        // 4) `simple` flag is skipped -- loop is optimized away. This optimization
        // is permitted because there was a typo in the hash first degree quads
        // algorithm in the URDNA2015 spec that was implemented widely making it
        // such that it could not be fixed; the result was that the loop only
        // needs to be run once and the first degree quad hashes will never change.
        // 5.1-5.2 are skipped; first degree quad hashes are generated just once
        // for all non-normalized blank nodes.

        // 5.3) For each blank node identifier identifier in non-normalized
        // identifiers:
        const hashToBlankNodes = new Map();
        const nonNormalized = [...this.blankNodeInfo.keys()];
        for(const id of nonNormalized) {
          // steps 5.3.1 and 5.3.2:
          this._hashAndTrackBlankNode({id, hashToBlankNodes});
        }

        // 5.4) For each hash to identifier list mapping in hash to blank
        // nodes map, lexicographically-sorted by hash:
        const hashes = [...hashToBlankNodes.keys()].sort();
        // optimize away second sort, gather non-unique hashes in order as we go
        const nonUnique = [];
        for(const hash of hashes) {
          // 5.4.1) If the length of identifier list is greater than 1,
          // continue to the next mapping.
          const idList = hashToBlankNodes.get(hash);
          if(idList.length > 1) {
            nonUnique.push(idList);
            continue;
          }

          // 5.4.2) Use the Issue Identifier algorithm, passing canonical
          // issuer and the single blank node identifier in identifier
          // list, identifier, to issue a canonical replacement identifier
          // for identifier.
          const id = idList[0];
          this.canonicalIssuer.getId(id);

          // Note: These steps are skipped, optimized away since the loop
          // only needs to be run once.
          // 5.4.3) Remove identifier from non-normalized identifiers.
          // 5.4.4) Remove hash from the hash to blank nodes map.
          // 5.4.5) Set simple to true.
        }

        // 6) For each hash to identifier list mapping in hash to blank nodes map,
        // lexicographically-sorted by hash:
        // Note: sort optimized away, use `nonUnique`.
        for(const idList of nonUnique) {
          // 6.1) Create hash path list where each item will be a result of
          // running the Hash N-Degree Quads algorithm.
          const hashPathList = [];

          // 6.2) For each blank node identifier identifier in identifier list:
          for(const id of idList) {
            // 6.2.1) If a canonical identifier has already been issued for
            // identifier, continue to the next identifier.
            if(this.canonicalIssuer.hasId(id)) {
              continue;
            }

            // 6.2.2) Create temporary issuer, an identifier issuer
            // initialized with the prefix _:b.
            const issuer = new IdentifierIssuer_1('_:b');

            // 6.2.3) Use the Issue Identifier algorithm, passing temporary
            // issuer and identifier, to issue a new temporary blank node
            // identifier for identifier.
            issuer.getId(id);

            // 6.2.4) Run the Hash N-Degree Quads algorithm, passing
            // temporary issuer, and append the result to the hash path list.
            const result = this.hashNDegreeQuads(id, issuer);
            hashPathList.push(result);
          }

          // 6.3) For each result in the hash path list,
          // lexicographically-sorted by the hash in result:
          hashPathList.sort(_stringHashCompare);
          for(const result of hashPathList) {
            // 6.3.1) For each blank node identifier, existing identifier,
            // that was issued a temporary identifier by identifier issuer
            // in result, issue a canonical identifier, in the same order,
            // using the Issue Identifier algorithm, passing canonical
            // issuer and existing identifier.
            const oldIds = result.issuer.getOldIds();
            for(const id of oldIds) {
              this.canonicalIssuer.getId(id);
            }
          }
        }

        /* Note: At this point all blank nodes in the set of RDF quads have been
        assigned canonical identifiers, which have been stored in the canonical
        issuer. Here each quad is updated by assigning each of its blank nodes
        its new identifier. */

        // 7) For each quad, quad, in input dataset:
        const normalized = [];
        for(const quad of this.quads) {
          // 7.1) Create a copy, quad copy, of quad and replace any existing
          // blank node identifiers using the canonical identifiers
          // previously issued by canonical issuer.
          // Note: We optimize with shallow copies here.
          const q = {...quad};
          q.subject = this._useCanonicalId({component: q.subject});
          q.object = this._useCanonicalId({component: q.object});
          q.graph = this._useCanonicalId({component: q.graph});
          // 7.2) Add quad copy to the normalized dataset.
          normalized.push(NQuads_1.serializeQuad(q));
        }

        // sort normalized output
        normalized.sort();

        // 8) Return the normalized dataset.
        return normalized.join('');
      }

      // 4.6) Hash First Degree Quads
      hashFirstDegreeQuads(id) {
        // 1) Initialize nquads to an empty list. It will be used to store quads in
        // N-Quads format.
        const nquads = [];

        // 2) Get the list of quads `quads` associated with the reference blank node
        // identifier in the blank node to quads map.
        const info = this.blankNodeInfo.get(id);
        const quads = info.quads;

        // 3) For each quad `quad` in `quads`:
        for(const quad of quads) {
          // 3.1) Serialize the quad in N-Quads format with the following special
          // rule:

          // 3.1.1) If any component in quad is an blank node, then serialize it
          // using a special identifier as follows:
          const copy = {
            subject: null, predicate: quad.predicate, object: null, graph: null
          };
          // 3.1.2) If the blank node's existing blank node identifier matches
          // the reference blank node identifier then use the blank node
          // identifier _:a, otherwise, use the blank node identifier _:z.
          copy.subject = this.modifyFirstDegreeComponent(
            id, quad.subject, 'subject');
          copy.object = this.modifyFirstDegreeComponent(
            id, quad.object, 'object');
          copy.graph = this.modifyFirstDegreeComponent(
            id, quad.graph, 'graph');
          nquads.push(NQuads_1.serializeQuad(copy));
        }

        // 4) Sort nquads in lexicographical order.
        nquads.sort();

        // 5) Return the hash that results from passing the sorted, joined nquads
        // through the hash algorithm.
        const md = new MessageDigestBrowser(this.hashAlgorithm);
        for(const nquad of nquads) {
          md.update(nquad);
        }
        info.hash = md.digest();
        return info.hash;
      }

      // 4.7) Hash Related Blank Node
      hashRelatedBlankNode(related, quad, issuer, position) {
        // 1) Set the identifier to use for related, preferring first the canonical
        // identifier for related if issued, second the identifier issued by issuer
        // if issued, and last, if necessary, the result of the Hash First Degree
        // Quads algorithm, passing related.
        let id;
        if(this.canonicalIssuer.hasId(related)) {
          id = this.canonicalIssuer.getId(related);
        } else if(issuer.hasId(related)) {
          id = issuer.getId(related);
        } else {
          id = this.blankNodeInfo.get(related).hash;
        }

        // 2) Initialize a string input to the value of position.
        // Note: We use a hash object instead.
        const md = new MessageDigestBrowser(this.hashAlgorithm);
        md.update(position);

        // 3) If position is not g, append <, the value of the predicate in quad,
        // and > to input.
        if(position !== 'g') {
          md.update(this.getRelatedPredicate(quad));
        }

        // 4) Append identifier to input.
        md.update(id);

        // 5) Return the hash that results from passing input through the hash
        // algorithm.
        return md.digest();
      }

      // 4.8) Hash N-Degree Quads
      hashNDegreeQuads(id, issuer) {
        // 1) Create a hash to related blank nodes map for storing hashes that
        // identify related blank nodes.
        // Note: 2) and 3) handled within `createHashToRelated`
        const md = new MessageDigestBrowser(this.hashAlgorithm);
        const hashToRelated = this.createHashToRelated(id, issuer);

        // 4) Create an empty string, data to hash.
        // Note: We created a hash object `md` above instead.

        // 5) For each related hash to blank node list mapping in hash to related
        // blank nodes map, sorted lexicographically by related hash:
        const hashes = [...hashToRelated.keys()].sort();
        for(const hash of hashes) {
          // 5.1) Append the related hash to the data to hash.
          md.update(hash);

          // 5.2) Create a string chosen path.
          let chosenPath = '';

          // 5.3) Create an unset chosen issuer variable.
          let chosenIssuer;

          // 5.4) For each permutation of blank node list:
          const permuter = new Permuter_1(hashToRelated.get(hash));
          while(permuter.hasNext()) {
            const permutation = permuter.next();

            // 5.4.1) Create a copy of issuer, issuer copy.
            let issuerCopy = issuer.clone();

            // 5.4.2) Create a string path.
            let path = '';

            // 5.4.3) Create a recursion list, to store blank node identifiers
            // that must be recursively processed by this algorithm.
            const recursionList = [];

            // 5.4.4) For each related in permutation:
            let nextPermutation = false;
            for(const related of permutation) {
              // 5.4.4.1) If a canonical identifier has been issued for
              // related, append it to path.
              if(this.canonicalIssuer.hasId(related)) {
                path += this.canonicalIssuer.getId(related);
              } else {
                // 5.4.4.2) Otherwise:
                // 5.4.4.2.1) If issuer copy has not issued an identifier for
                // related, append related to recursion list.
                if(!issuerCopy.hasId(related)) {
                  recursionList.push(related);
                }
                // 5.4.4.2.2) Use the Issue Identifier algorithm, passing
                // issuer copy and related and append the result to path.
                path += issuerCopy.getId(related);
              }

              // 5.4.4.3) If chosen path is not empty and the length of path
              // is greater than or equal to the length of chosen path and
              // path is lexicographically greater than chosen path, then
              // skip to the next permutation.
              // Note: Comparing path length to chosen path length can be optimized
              // away; only compare lexicographically.
              if(chosenPath.length !== 0 && path > chosenPath) {
                nextPermutation = true;
                break;
              }
            }

            if(nextPermutation) {
              continue;
            }

            // 5.4.5) For each related in recursion list:
            for(const related of recursionList) {
              // 5.4.5.1) Set result to the result of recursively executing
              // the Hash N-Degree Quads algorithm, passing related for
              // identifier and issuer copy for path identifier issuer.
              const result = this.hashNDegreeQuads(related, issuerCopy);

              // 5.4.5.2) Use the Issue Identifier algorithm, passing issuer
              // copy and related and append the result to path.
              path += issuerCopy.getId(related);

              // 5.4.5.3) Append <, the hash in result, and > to path.
              path += `<${result.hash}>`;

              // 5.4.5.4) Set issuer copy to the identifier issuer in
              // result.
              issuerCopy = result.issuer;

              // 5.4.5.5) If chosen path is not empty and the length of path
              // is greater than or equal to the length of chosen path and
              // path is lexicographically greater than chosen path, then
              // skip to the next permutation.
              // Note: Comparing path length to chosen path length can be optimized
              // away; only compare lexicographically.
              if(chosenPath.length !== 0 && path > chosenPath) {
                nextPermutation = true;
                break;
              }
            }

            if(nextPermutation) {
              continue;
            }

            // 5.4.6) If chosen path is empty or path is lexicographically
            // less than chosen path, set chosen path to path and chosen
            // issuer to issuer copy.
            if(chosenPath.length === 0 || path < chosenPath) {
              chosenPath = path;
              chosenIssuer = issuerCopy;
            }
          }

          // 5.5) Append chosen path to data to hash.
          md.update(chosenPath);

          // 5.6) Replace issuer, by reference, with chosen issuer.
          issuer = chosenIssuer;
        }

        // 6) Return issuer and the hash that results from passing data to hash
        // through the hash algorithm.
        return {hash: md.digest(), issuer};
      }

      // helper for modifying component during Hash First Degree Quads
      modifyFirstDegreeComponent(id, component) {
        if(component.termType !== 'BlankNode') {
          return component;
        }
        /* Note: A mistake in the URDNA2015 spec that made its way into
        implementations (and therefore must stay to avoid interop breakage)
        resulted in an assigned canonical ID, if available for
        `component.value`, not being used in place of `_:a`/`_:z`, so
        we don't use it here. */
        return {
          termType: 'BlankNode',
          value: component.value === id ? '_:a' : '_:z'
        };
      }

      // helper for getting a related predicate
      getRelatedPredicate(quad) {
        return `<${quad.predicate.value}>`;
      }

      // helper for creating hash to related blank nodes map
      createHashToRelated(id, issuer) {
        // 1) Create a hash to related blank nodes map for storing hashes that
        // identify related blank nodes.
        const hashToRelated = new Map();

        // 2) Get a reference, quads, to the list of quads in the blank node to
        // quads map for the key identifier.
        const quads = this.blankNodeInfo.get(id).quads;

        // 3) For each quad in quads:
        for(const quad of quads) {
          // 3.1) For each component in quad, if component is the subject, object,
          // or graph name and it is a blank node that is not identified by
          // identifier:
          // steps 3.1.1 and 3.1.2 occur in helpers:
          this._addRelatedBlankNodeHash({
            quad, component: quad.subject, position: 's',
            id, issuer, hashToRelated
          });
          this._addRelatedBlankNodeHash({
            quad, component: quad.object, position: 'o',
            id, issuer, hashToRelated
          });
          this._addRelatedBlankNodeHash({
            quad, component: quad.graph, position: 'g',
            id, issuer, hashToRelated
          });
        }

        return hashToRelated;
      }

      _hashAndTrackBlankNode({id, hashToBlankNodes}) {
        // 5.3.1) Create a hash, hash, according to the Hash First Degree
        // Quads algorithm.
        const hash = this.hashFirstDegreeQuads(id);

        // 5.3.2) Add hash and identifier to hash to blank nodes map,
        // creating a new entry if necessary.
        const idList = hashToBlankNodes.get(hash);
        if(!idList) {
          hashToBlankNodes.set(hash, [id]);
        } else {
          idList.push(id);
        }
      }

      _addBlankNodeQuadInfo({quad, component}) {
        if(component.termType !== 'BlankNode') {
          return;
        }
        const id = component.value;
        const info = this.blankNodeInfo.get(id);
        if(info) {
          info.quads.add(quad);
        } else {
          this.blankNodeInfo.set(id, {quads: new Set([quad]), hash: null});
        }
      }

      _addRelatedBlankNodeHash(
        {quad, component, position, id, issuer, hashToRelated}) {
        if(!(component.termType === 'BlankNode' && component.value !== id)) {
          return;
        }
        // 3.1.1) Set hash to the result of the Hash Related Blank Node
        // algorithm, passing the blank node identifier for component as
        // related, quad, path identifier issuer as issuer, and position as
        // either s, o, or g based on whether component is a subject, object,
        // graph name, respectively.
        const related = component.value;
        const hash = this.hashRelatedBlankNode(related, quad, issuer, position);

        // 3.1.2) Add a mapping of hash to the blank node identifier for
        // component to hash to related blank nodes map, adding an entry as
        // necessary.
        const entries = hashToRelated.get(hash);
        if(entries) {
          entries.push(related);
        } else {
          hashToRelated.set(hash, [related]);
        }
      }

      _useCanonicalId({component}) {
        if(component.termType === 'BlankNode' &&
          !component.value.startsWith(this.canonicalIssuer.prefix)) {
          return {
            termType: 'BlankNode',
            value: this.canonicalIssuer.getId(component.value)
          };
        }
        return component;
      }
    };

    function _stringHashCompare(a, b) {
      return a.hash < b.hash ? -1 : a.hash > b.hash ? 1 : 0;
    }

    /*
     * Copyright (c) 2016-2021 Digital Bazaar, Inc. All rights reserved.
     */



    var URGNA2012Sync = class URDNA2012Sync extends URDNA2015Sync_1 {
      constructor() {
        super();
        this.name = 'URGNA2012';
        this.hashAlgorithm = 'sha1';
      }

      // helper for modifying component during Hash First Degree Quads
      modifyFirstDegreeComponent(id, component, key) {
        if(component.termType !== 'BlankNode') {
          return component;
        }
        if(key === 'graph') {
          return {
            termType: 'BlankNode',
            value: '_:g'
          };
        }
        return {
          termType: 'BlankNode',
          value: (component.value === id ? '_:a' : '_:z')
        };
      }

      // helper for getting a related predicate
      getRelatedPredicate(quad) {
        return quad.predicate.value;
      }

      // helper for creating hash to related blank nodes map
      createHashToRelated(id, issuer) {
        // 1) Create a hash to related blank nodes map for storing hashes that
        // identify related blank nodes.
        const hashToRelated = new Map();

        // 2) Get a reference, quads, to the list of quads in the blank node to
        // quads map for the key identifier.
        const quads = this.blankNodeInfo.get(id).quads;

        // 3) For each quad in quads:
        for(const quad of quads) {
          // 3.1) If the quad's subject is a blank node that does not match
          // identifier, set hash to the result of the Hash Related Blank Node
          // algorithm, passing the blank node identifier for subject as related,
          // quad, path identifier issuer as issuer, and p as position.
          let position;
          let related;
          if(quad.subject.termType === 'BlankNode' && quad.subject.value !== id) {
            related = quad.subject.value;
            position = 'p';
          } else if(
            quad.object.termType === 'BlankNode' && quad.object.value !== id) {
            // 3.2) Otherwise, if quad's object is a blank node that does not match
            // identifier, to the result of the Hash Related Blank Node algorithm,
            // passing the blank node identifier for object as related, quad, path
            // identifier issuer as issuer, and r as position.
            related = quad.object.value;
            position = 'r';
          } else {
            // 3.3) Otherwise, continue to the next quad.
            continue;
          }
          // 3.4) Add a mapping of hash to the blank node identifier for the
          // component that matched (subject or object) to hash to related blank
          // nodes map, adding an entry as necessary.
          const hash = this.hashRelatedBlankNode(related, quad, issuer, position);
          const entries = hashToRelated.get(hash);
          if(entries) {
            entries.push(related);
          } else {
            hashToRelated.set(hash, [related]);
          }
        }

        return hashToRelated;
      }
    };

    var _nodeResolve_empty = {};

    var _nodeResolve_empty$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': _nodeResolve_empty
    });

    var require$$0 = /*@__PURE__*/getAugmentedNamespace(_nodeResolve_empty$1);

    /**
     * An implementation of the RDF Dataset Normalization specification.
     * This library works in the browser and node.js.
     *
     * BSD 3-Clause License
     * Copyright (c) 2016-2021 Digital Bazaar, Inc.
     * All rights reserved.
     *
     * Redistribution and use in source and binary forms, with or without
     * modification, are permitted provided that the following conditions are met:
     *
     * Redistributions of source code must retain the above copyright notice,
     * this list of conditions and the following disclaimer.
     *
     * Redistributions in binary form must reproduce the above copyright
     * notice, this list of conditions and the following disclaimer in the
     * documentation and/or other materials provided with the distribution.
     *
     * Neither the name of the Digital Bazaar, Inc. nor the names of its
     * contributors may be used to endorse or promote products derived from
     * this software without specific prior written permission.
     *
     * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
     * IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
     * TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
     * PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
     * HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
     * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
     * TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
     * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
     * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
     * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
     * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
     */






    // optional native support
    let rdfCanonizeNative;
    try {
      rdfCanonizeNative = require$$0;
    } catch(e) {}

    const api$d = {};
    var lib = api$d;

    // expose helpers
    api$d.NQuads = NQuads_1;
    api$d.IdentifierIssuer = IdentifierIssuer_1;

    /**
     * Get or set native API.
     *
     * @param api the native API.
     *
     * @return the currently set native API.
     */
    api$d._rdfCanonizeNative = function(api) {
      if(api) {
        rdfCanonizeNative = api;
      }
      return rdfCanonizeNative;
    };

    /**
     * Asynchronously canonizes an RDF dataset.
     *
     * @param dataset the dataset to canonize.
     * @param options the options to use:
     *          algorithm the canonicalization algorithm to use, `URDNA2015` or
     *            `URGNA2012`.
     *          [useNative] use native implementation (default: false).
     *
     * @return a Promise that resolves to the canonicalized RDF Dataset.
     */
    api$d.canonize = async function(dataset, options) {
      // back-compat with legacy dataset
      if(!Array.isArray(dataset)) {
        dataset = api$d.NQuads.legacyDatasetToQuads(dataset);
      }

      if(options.useNative) {
        if(!rdfCanonizeNative) {
          throw new Error('rdf-canonize-native not available');
        }
        // TODO: convert native algorithm to Promise-based async
        return new Promise((resolve, reject) =>
          rdfCanonizeNative.canonize(dataset, options, (err, canonical) =>
            err ? reject(err) : resolve(canonical)));
      }

      if(options.algorithm === 'URDNA2015') {
        return new URDNA2015_1(options).main(dataset);
      }
      if(options.algorithm === 'URGNA2012') {
        return new URGNA2012(options).main(dataset);
      }
      if(!('algorithm' in options)) {
        throw new Error('No RDF Dataset Canonicalization algorithm specified.');
      }
      throw new Error(
        'Invalid RDF Dataset Canonicalization algorithm: ' + options.algorithm);
    };

    /**
     * This method is no longer available in the public API, it is for testing
     * only. It synchronously canonizes an RDF dataset and does not work in the
     * browser.
     *
     * @param dataset the dataset to canonize.
     * @param options the options to use:
     *          algorithm the canonicalization algorithm to use, `URDNA2015` or
     *            `URGNA2012`.
     *          [useNative] use native implementation (default: false).
     *
     * @return the RDF dataset in canonical form.
     */
    api$d._canonizeSync = function(dataset, options) {
      // back-compat with legacy dataset
      if(!Array.isArray(dataset)) {
        dataset = api$d.NQuads.legacyDatasetToQuads(dataset);
      }

      if(options.useNative) {
        if(rdfCanonizeNative) {
          return rdfCanonizeNative.canonizeSync(dataset, options);
        }
        throw new Error('rdf-canonize-native not available');
      }
      if(options.algorithm === 'URDNA2015') {
        return new URDNA2015Sync_1(options).main(dataset);
      }
      if(options.algorithm === 'URGNA2012') {
        return new URGNA2012Sync(options).main(dataset);
      }
      if(!('algorithm' in options)) {
        throw new Error('No RDF Dataset Canonicalization algorithm specified.');
      }
      throw new Error(
        'Invalid RDF Dataset Canonicalization algorithm: ' + options.algorithm);
    };

    /**
     * An implementation of the RDF Dataset Normalization specification.
     *
     * @author Dave Longley
     *
     * Copyright 2010-2021 Digital Bazaar, Inc.
     */

    var rdfCanonize = lib;

    /*
     * Copyright (c) 2017 Digital Bazaar, Inc. All rights reserved.
     */

    const api$c = {};
    var types = api$c;

    /**
     * Returns true if the given value is an Array.
     *
     * @param v the value to check.
     *
     * @return true if the value is an Array, false if not.
     */
    api$c.isArray = Array.isArray;

    /**
     * Returns true if the given value is a Boolean.
     *
     * @param v the value to check.
     *
     * @return true if the value is a Boolean, false if not.
     */
    api$c.isBoolean = v => (typeof v === 'boolean' ||
      Object.prototype.toString.call(v) === '[object Boolean]');

    /**
     * Returns true if the given value is a double.
     *
     * @param v the value to check.
     *
     * @return true if the value is a double, false if not.
     */
    api$c.isDouble = v => api$c.isNumber(v) &&
      (String(v).indexOf('.') !== -1 || Math.abs(v) >= 1e21);

    /**
     * Returns true if the given value is an empty Object.
     *
     * @param v the value to check.
     *
     * @return true if the value is an empty Object, false if not.
     */
    api$c.isEmptyObject = v => api$c.isObject(v) && Object.keys(v).length === 0;

    /**
     * Returns true if the given value is a Number.
     *
     * @param v the value to check.
     *
     * @return true if the value is a Number, false if not.
     */
    api$c.isNumber = v => (typeof v === 'number' ||
      Object.prototype.toString.call(v) === '[object Number]');

    /**
     * Returns true if the given value is numeric.
     *
     * @param v the value to check.
     *
     * @return true if the value is numeric, false if not.
     */
    api$c.isNumeric = v => !isNaN(parseFloat(v)) && isFinite(v);

    /**
     * Returns true if the given value is an Object.
     *
     * @param v the value to check.
     *
     * @return true if the value is an Object, false if not.
     */
    api$c.isObject = v => Object.prototype.toString.call(v) === '[object Object]';

    /**
     * Returns true if the given value is a String.
     *
     * @param v the value to check.
     *
     * @return true if the value is a String, false if not.
     */
    api$c.isString = v => (typeof v === 'string' ||
      Object.prototype.toString.call(v) === '[object String]');

    /**
     * Returns true if the given value is undefined.
     *
     * @param v the value to check.
     *
     * @return true if the value is undefined, false if not.
     */
    api$c.isUndefined = v => typeof v === 'undefined';

    /*
     * Copyright (c) 2017 Digital Bazaar, Inc. All rights reserved.
     */



    const api$b = {};
    var graphTypes = api$b;

    /**
     * Returns true if the given value is a subject with properties.
     *
     * @param v the value to check.
     *
     * @return true if the value is a subject with properties, false if not.
     */
    api$b.isSubject = v => {
      // Note: A value is a subject if all of these hold true:
      // 1. It is an Object.
      // 2. It is not a @value, @set, or @list.
      // 3. It has more than 1 key OR any existing key is not @id.
      if(types.isObject(v) &&
        !(('@value' in v) || ('@set' in v) || ('@list' in v))) {
        const keyCount = Object.keys(v).length;
        return (keyCount > 1 || !('@id' in v));
      }
      return false;
    };

    /**
     * Returns true if the given value is a subject reference.
     *
     * @param v the value to check.
     *
     * @return true if the value is a subject reference, false if not.
     */
    api$b.isSubjectReference = v =>
      // Note: A value is a subject reference if all of these hold true:
      // 1. It is an Object.
      // 2. It has a single key: @id.
      (types.isObject(v) && Object.keys(v).length === 1 && ('@id' in v));

    /**
     * Returns true if the given value is a @value.
     *
     * @param v the value to check.
     *
     * @return true if the value is a @value, false if not.
     */
    api$b.isValue = v =>
      // Note: A value is a @value if all of these hold true:
      // 1. It is an Object.
      // 2. It has the @value property.
      types.isObject(v) && ('@value' in v);

    /**
     * Returns true if the given value is a @list.
     *
     * @param v the value to check.
     *
     * @return true if the value is a @list, false if not.
     */
    api$b.isList = v =>
      // Note: A value is a @list if all of these hold true:
      // 1. It is an Object.
      // 2. It has the @list property.
      types.isObject(v) && ('@list' in v);

    /**
     * Returns true if the given value is a @graph.
     *
     * @return true if the value is a @graph, false if not.
     */
    api$b.isGraph = v => {
      // Note: A value is a graph if all of these hold true:
      // 1. It is an object.
      // 2. It has an `@graph` key.
      // 3. It may have '@id' or '@index'
      return types.isObject(v) &&
        '@graph' in v &&
        Object.keys(v)
          .filter(key => key !== '@id' && key !== '@index').length === 1;
    };

    /**
     * Returns true if the given value is a simple @graph.
     *
     * @return true if the value is a simple @graph, false if not.
     */
    api$b.isSimpleGraph = v => {
      // Note: A value is a simple graph if all of these hold true:
      // 1. It is an object.
      // 2. It has an `@graph` key.
      // 3. It has only 1 key or 2 keys where one of them is `@index`.
      return api$b.isGraph(v) && !('@id' in v);
    };

    /**
     * Returns true if the given value is a blank node.
     *
     * @param v the value to check.
     *
     * @return true if the value is a blank node, false if not.
     */
    api$b.isBlankNode = v => {
      // Note: A value is a blank node if all of these hold true:
      // 1. It is an Object.
      // 2. If it has an @id key its value begins with '_:'.
      // 3. It has no keys OR is not a @value, @set, or @list.
      if(types.isObject(v)) {
        if('@id' in v) {
          return (v['@id'].indexOf('_:') === 0);
        }
        return (Object.keys(v).length === 0 ||
          !(('@value' in v) || ('@set' in v) || ('@list' in v)));
      }
      return false;
    };

    /*
     * Copyright (c) 2017 Digital Bazaar, Inc. All rights reserved.
     */

    var JsonLdError_1 = class JsonLdError extends Error {
      /**
       * Creates a JSON-LD Error.
       *
       * @param msg the error message.
       * @param type the error type.
       * @param details the error details.
       */
      constructor(
        message = 'An unspecified JSON-LD error occurred.',
        name = 'jsonld.Error',
        details = {}) {
        super(message);
        this.name = name;
        this.message = message;
        this.details = details;
      }
    };

    /*
     * Copyright (c) 2017-2019 Digital Bazaar, Inc. All rights reserved.
     */



    // TODO: move `IdentifierIssuer` to its own package
    const IdentifierIssuer$1 = rdfCanonize.IdentifierIssuer;


    // constants
    const REGEX_LINK_HEADERS = /(?:<[^>]*?>|"[^"]*?"|[^,])+/g;
    const REGEX_LINK_HEADER$1 = /\s*<([^>]*?)>\s*(?:;\s*(.*))?/;
    const REGEX_LINK_HEADER_PARAMS =
      /(.*?)=(?:(?:"([^"]*?)")|([^"]*?))\s*(?:(?:;\s*)|$)/g;

    const DEFAULTS = {
      headers: {
        accept: 'application/ld+json, application/json'
      }
    };

    const api$a = {};
    var util = api$a;
    api$a.IdentifierIssuer = IdentifierIssuer$1;

    /**
     * Clones an object, array, Map, Set, or string/number. If a typed JavaScript
     * object is given, such as a Date, it will be converted to a string.
     *
     * @param value the value to clone.
     *
     * @return the cloned value.
     */
    api$a.clone = function(value) {
      if(value && typeof value === 'object') {
        let rval;
        if(types.isArray(value)) {
          rval = [];
          for(let i = 0; i < value.length; ++i) {
            rval[i] = api$a.clone(value[i]);
          }
        } else if(value instanceof Map) {
          rval = new Map();
          for(const [k, v] of value) {
            rval.set(k, api$a.clone(v));
          }
        } else if(value instanceof Set) {
          rval = new Set();
          for(const v of value) {
            rval.add(api$a.clone(v));
          }
        } else if(types.isObject(value)) {
          rval = {};
          for(const key in value) {
            rval[key] = api$a.clone(value[key]);
          }
        } else {
          rval = value.toString();
        }
        return rval;
      }
      return value;
    };

    /**
     * Ensure a value is an array. If the value is an array, it is returned.
     * Otherwise, it is wrapped in an array.
     *
     * @param value the value to return as an array.
     *
     * @return the value as an array.
     */
    api$a.asArray = function(value) {
      return Array.isArray(value) ? value : [value];
    };

    /**
     * Builds an HTTP headers object for making a JSON-LD request from custom
     * headers and asserts the `accept` header isn't overridden.
     *
     * @param headers an object of headers with keys as header names and values
     *          as header values.
     *
     * @return an object of headers with a valid `accept` header.
     */
    api$a.buildHeaders = (headers = {}) => {
      const hasAccept = Object.keys(headers).some(
        h => h.toLowerCase() === 'accept');

      if(hasAccept) {
        throw new RangeError(
          'Accept header may not be specified; only "' +
          DEFAULTS.headers.accept + '" is supported.');
      }

      return Object.assign({Accept: DEFAULTS.headers.accept}, headers);
    };

    /**
     * Parses a link header. The results will be key'd by the value of "rel".
     *
     * Link: <http://json-ld.org/contexts/person.jsonld>;
     * rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"
     *
     * Parses as: {
     *   'http://www.w3.org/ns/json-ld#context': {
     *     target: http://json-ld.org/contexts/person.jsonld,
     *     type: 'application/ld+json'
     *   }
     * }
     *
     * If there is more than one "rel" with the same IRI, then entries in the
     * resulting map for that "rel" will be arrays.
     *
     * @param header the link header to parse.
     */
    api$a.parseLinkHeader = header => {
      const rval = {};
      // split on unbracketed/unquoted commas
      const entries = header.match(REGEX_LINK_HEADERS);
      for(let i = 0; i < entries.length; ++i) {
        let match = entries[i].match(REGEX_LINK_HEADER$1);
        if(!match) {
          continue;
        }
        const result = {target: match[1]};
        const params = match[2];
        while((match = REGEX_LINK_HEADER_PARAMS.exec(params))) {
          result[match[1]] = (match[2] === undefined) ? match[3] : match[2];
        }
        const rel = result['rel'] || '';
        if(Array.isArray(rval[rel])) {
          rval[rel].push(result);
        } else if(rval.hasOwnProperty(rel)) {
          rval[rel] = [rval[rel], result];
        } else {
          rval[rel] = result;
        }
      }
      return rval;
    };

    /**
     * Throws an exception if the given value is not a valid @type value.
     *
     * @param v the value to check.
     */
    api$a.validateTypeValue = (v, isFrame) => {
      if(types.isString(v)) {
        return;
      }

      if(types.isArray(v) && v.every(vv => types.isString(vv))) {
        return;
      }
      if(isFrame && types.isObject(v)) {
        switch(Object.keys(v).length) {
          case 0:
            // empty object is wildcard
            return;
          case 1:
            // default entry is all strings
            if('@default' in v &&
              api$a.asArray(v['@default']).every(vv => types.isString(vv))) {
              return;
            }
        }
      }

      throw new JsonLdError_1(
        'Invalid JSON-LD syntax; "@type" value must a string, an array of ' +
        'strings, an empty object, ' +
        'or a default object.', 'jsonld.SyntaxError',
        {code: 'invalid type value', value: v});
    };

    /**
     * Returns true if the given subject has the given property.
     *
     * @param subject the subject to check.
     * @param property the property to look for.
     *
     * @return true if the subject has the given property, false if not.
     */
    api$a.hasProperty = (subject, property) => {
      if(subject.hasOwnProperty(property)) {
        const value = subject[property];
        return (!types.isArray(value) || value.length > 0);
      }
      return false;
    };

    /**
     * Determines if the given value is a property of the given subject.
     *
     * @param subject the subject to check.
     * @param property the property to check.
     * @param value the value to check.
     *
     * @return true if the value exists, false if not.
     */
    api$a.hasValue = (subject, property, value) => {
      if(api$a.hasProperty(subject, property)) {
        let val = subject[property];
        const isList = graphTypes.isList(val);
        if(types.isArray(val) || isList) {
          if(isList) {
            val = val['@list'];
          }
          for(let i = 0; i < val.length; ++i) {
            if(api$a.compareValues(value, val[i])) {
              return true;
            }
          }
        } else if(!types.isArray(value)) {
          // avoid matching the set of values with an array value parameter
          return api$a.compareValues(value, val);
        }
      }
      return false;
    };

    /**
     * Adds a value to a subject. If the value is an array, all values in the
     * array will be added.
     *
     * @param subject the subject to add the value to.
     * @param property the property that relates the value to the subject.
     * @param value the value to add.
     * @param [options] the options to use:
     *        [propertyIsArray] true if the property is always an array, false
     *          if not (default: false).
     *        [valueIsArray] true if the value to be added should be preserved as
     *          an array (lists) (default: false).
     *        [allowDuplicate] true to allow duplicates, false not to (uses a
     *          simple shallow comparison of subject ID or value) (default: true).
     *        [prependValue] false to prepend value to any existing values.
     *          (default: false)
     */
    api$a.addValue = (subject, property, value, options) => {
      options = options || {};
      if(!('propertyIsArray' in options)) {
        options.propertyIsArray = false;
      }
      if(!('valueIsArray' in options)) {
        options.valueIsArray = false;
      }
      if(!('allowDuplicate' in options)) {
        options.allowDuplicate = true;
      }
      if(!('prependValue' in options)) {
        options.prependValue = false;
      }

      if(options.valueIsArray) {
        subject[property] = value;
      } else if(types.isArray(value)) {
        if(value.length === 0 && options.propertyIsArray &&
          !subject.hasOwnProperty(property)) {
          subject[property] = [];
        }
        if(options.prependValue) {
          value = value.concat(subject[property]);
          subject[property] = [];
        }
        for(let i = 0; i < value.length; ++i) {
          api$a.addValue(subject, property, value[i], options);
        }
      } else if(subject.hasOwnProperty(property)) {
        // check if subject already has value if duplicates not allowed
        const hasValue = (!options.allowDuplicate &&
          api$a.hasValue(subject, property, value));

        // make property an array if value not present or always an array
        if(!types.isArray(subject[property]) &&
          (!hasValue || options.propertyIsArray)) {
          subject[property] = [subject[property]];
        }

        // add new value
        if(!hasValue) {
          if(options.prependValue) {
            subject[property].unshift(value);
          } else {
            subject[property].push(value);
          }
        }
      } else {
        // add new value as set or single value
        subject[property] = options.propertyIsArray ? [value] : value;
      }
    };

    /**
     * Gets all of the values for a subject's property as an array.
     *
     * @param subject the subject.
     * @param property the property.
     *
     * @return all of the values for a subject's property as an array.
     */
    api$a.getValues = (subject, property) => [].concat(subject[property] || []);

    /**
     * Removes a property from a subject.
     *
     * @param subject the subject.
     * @param property the property.
     */
    api$a.removeProperty = (subject, property) => {
      delete subject[property];
    };

    /**
     * Removes a value from a subject.
     *
     * @param subject the subject.
     * @param property the property that relates the value to the subject.
     * @param value the value to remove.
     * @param [options] the options to use:
     *          [propertyIsArray] true if the property is always an array, false
     *            if not (default: false).
     */
    api$a.removeValue = (subject, property, value, options) => {
      options = options || {};
      if(!('propertyIsArray' in options)) {
        options.propertyIsArray = false;
      }

      // filter out value
      const values = api$a.getValues(subject, property).filter(
        e => !api$a.compareValues(e, value));

      if(values.length === 0) {
        api$a.removeProperty(subject, property);
      } else if(values.length === 1 && !options.propertyIsArray) {
        subject[property] = values[0];
      } else {
        subject[property] = values;
      }
    };

    /**
     * Relabels all blank nodes in the given JSON-LD input.
     *
     * @param input the JSON-LD input.
     * @param [options] the options to use:
     *          [issuer] an IdentifierIssuer to use to label blank nodes.
     */
    api$a.relabelBlankNodes = (input, options) => {
      options = options || {};
      const issuer = options.issuer || new IdentifierIssuer$1('_:b');
      return _labelBlankNodes(issuer, input);
    };

    /**
     * Compares two JSON-LD values for equality. Two JSON-LD values will be
     * considered equal if:
     *
     * 1. They are both primitives of the same type and value.
     * 2. They are both @values with the same @value, @type, @language,
     *   and @index, OR
     * 3. They both have @ids they are the same.
     *
     * @param v1 the first value.
     * @param v2 the second value.
     *
     * @return true if v1 and v2 are considered equal, false if not.
     */
    api$a.compareValues = (v1, v2) => {
      // 1. equal primitives
      if(v1 === v2) {
        return true;
      }

      // 2. equal @values
      if(graphTypes.isValue(v1) && graphTypes.isValue(v2) &&
        v1['@value'] === v2['@value'] &&
        v1['@type'] === v2['@type'] &&
        v1['@language'] === v2['@language'] &&
        v1['@index'] === v2['@index']) {
        return true;
      }

      // 3. equal @ids
      if(types.isObject(v1) &&
        ('@id' in v1) &&
        types.isObject(v2) &&
        ('@id' in v2)) {
        return v1['@id'] === v2['@id'];
      }

      return false;
    };

    /**
     * Compares two strings first based on length and then lexicographically.
     *
     * @param a the first string.
     * @param b the second string.
     *
     * @return -1 if a < b, 1 if a > b, 0 if a === b.
     */
    api$a.compareShortestLeast = (a, b) => {
      if(a.length < b.length) {
        return -1;
      }
      if(b.length < a.length) {
        return 1;
      }
      if(a === b) {
        return 0;
      }
      return (a < b) ? -1 : 1;
    };

    /**
     * Labels the blank nodes in the given value using the given IdentifierIssuer.
     *
     * @param issuer the IdentifierIssuer to use.
     * @param element the element with blank nodes to rename.
     *
     * @return the element.
     */
    function _labelBlankNodes(issuer, element) {
      if(types.isArray(element)) {
        for(let i = 0; i < element.length; ++i) {
          element[i] = _labelBlankNodes(issuer, element[i]);
        }
      } else if(graphTypes.isList(element)) {
        element['@list'] = _labelBlankNodes(issuer, element['@list']);
      } else if(types.isObject(element)) {
        // relabel blank node
        if(graphTypes.isBlankNode(element)) {
          element['@id'] = issuer.getId(element['@id']);
        }

        // recursively apply to all keys
        const keys = Object.keys(element).sort();
        for(let ki = 0; ki < keys.length; ++ki) {
          const key = keys[ki];
          if(key !== '@id') {
            element[key] = _labelBlankNodes(issuer, element[key]);
          }
        }
      }

      return element;
    }

    /*
     * Copyright (c) 2017 Digital Bazaar, Inc. All rights reserved.
     */

    const RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
    const XSD = 'http://www.w3.org/2001/XMLSchema#';

    var constants = {
      // TODO: Deprecated and will be removed later. Use LINK_HEADER_CONTEXT.
      LINK_HEADER_REL: 'http://www.w3.org/ns/json-ld#context',

      LINK_HEADER_CONTEXT: 'http://www.w3.org/ns/json-ld#context',

      RDF,
      RDF_LIST: RDF + 'List',
      RDF_FIRST: RDF + 'first',
      RDF_REST: RDF + 'rest',
      RDF_NIL: RDF + 'nil',
      RDF_TYPE: RDF + 'type',
      RDF_PLAIN_LITERAL: RDF + 'PlainLiteral',
      RDF_XML_LITERAL: RDF + 'XMLLiteral',
      RDF_JSON_LITERAL: RDF + 'JSON',
      RDF_OBJECT: RDF + 'object',
      RDF_LANGSTRING: RDF + 'langString',

      XSD,
      XSD_BOOLEAN: XSD + 'boolean',
      XSD_DOUBLE: XSD + 'double',
      XSD_INTEGER: XSD + 'integer',
      XSD_STRING: XSD + 'string',
    };

    /*
     * Copyright (c) 2017-2019 Digital Bazaar, Inc. All rights reserved.
     */

    var RequestQueue_1 = class RequestQueue {
      /**
       * Creates a simple queue for requesting documents.
       */
      constructor() {
        this._requests = {};
      }

      wrapLoader(loader) {
        const self = this;
        self._loader = loader;
        return function(/* url */) {
          return self.add.apply(self, arguments);
        };
      }

      async add(url) {
        let promise = this._requests[url];
        if(promise) {
          // URL already queued, wait for it to load
          return Promise.resolve(promise);
        }

        // queue URL and load it
        promise = this._requests[url] = this._loader(url);

        try {
          return await promise;
        } finally {
          delete this._requests[url];
        }
      }
    };

    /*
     * Copyright (c) 2017 Digital Bazaar, Inc. All rights reserved.
     */



    const api$9 = {};
    var url = api$9;

    // define URL parser
    // parseUri 1.2.2
    // (c) Steven Levithan <stevenlevithan.com>
    // MIT License
    // with local jsonld.js modifications
    api$9.parsers = {
      simple: {
        // RFC 3986 basic parts
        keys: [
          'href', 'scheme', 'authority', 'path', 'query', 'fragment'
        ],
        /* eslint-disable-next-line max-len */
        regex: /^(?:([^:\/?#]+):)?(?:\/\/([^\/?#]*))?([^?#]*)(?:\?([^#]*))?(?:#(.*))?/
      },
      full: {
        keys: [
          'href', 'protocol', 'scheme', 'authority', 'auth', 'user', 'password',
          'hostname', 'port', 'path', 'directory', 'file', 'query', 'fragment'
        ],
        /* eslint-disable-next-line max-len */
        regex: /^(([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?(?:(((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/
      }
    };
    api$9.parse = (str, parser) => {
      const parsed = {};
      const o = api$9.parsers[parser || 'full'];
      const m = o.regex.exec(str);
      let i = o.keys.length;
      while(i--) {
        parsed[o.keys[i]] = (m[i] === undefined) ? null : m[i];
      }

      // remove default ports in found in URLs
      if((parsed.scheme === 'https' && parsed.port === '443') ||
        (parsed.scheme === 'http' && parsed.port === '80')) {
        parsed.href = parsed.href.replace(':' + parsed.port, '');
        parsed.authority = parsed.authority.replace(':' + parsed.port, '');
        parsed.port = null;
      }

      parsed.normalizedPath = api$9.removeDotSegments(parsed.path);
      return parsed;
    };

    /**
     * Prepends a base IRI to the given relative IRI.
     *
     * @param base the base IRI.
     * @param iri the relative IRI.
     *
     * @return the absolute IRI.
     */
    api$9.prependBase = (base, iri) => {
      // skip IRI processing
      if(base === null) {
        return iri;
      }
      // already an absolute IRI
      if(api$9.isAbsolute(iri)) {
        return iri;
      }

      // parse base if it is a string
      if(!base || types.isString(base)) {
        base = api$9.parse(base || '');
      }

      // parse given IRI
      const rel = api$9.parse(iri);

      // per RFC3986 5.2.2
      const transform = {
        protocol: base.protocol || ''
      };

      if(rel.authority !== null) {
        transform.authority = rel.authority;
        transform.path = rel.path;
        transform.query = rel.query;
      } else {
        transform.authority = base.authority;

        if(rel.path === '') {
          transform.path = base.path;
          if(rel.query !== null) {
            transform.query = rel.query;
          } else {
            transform.query = base.query;
          }
        } else {
          if(rel.path.indexOf('/') === 0) {
            // IRI represents an absolute path
            transform.path = rel.path;
          } else {
            // merge paths
            let path = base.path;

            // append relative path to the end of the last directory from base
            path = path.substr(0, path.lastIndexOf('/') + 1);
            if((path.length > 0 || base.authority) && path.substr(-1) !== '/') {
              path += '/';
            }
            path += rel.path;

            transform.path = path;
          }
          transform.query = rel.query;
        }
      }

      if(rel.path !== '') {
        // remove slashes and dots in path
        transform.path = api$9.removeDotSegments(transform.path);
      }

      // construct URL
      let rval = transform.protocol;
      if(transform.authority !== null) {
        rval += '//' + transform.authority;
      }
      rval += transform.path;
      if(transform.query !== null) {
        rval += '?' + transform.query;
      }
      if(rel.fragment !== null) {
        rval += '#' + rel.fragment;
      }

      // handle empty base
      if(rval === '') {
        rval = './';
      }

      return rval;
    };

    /**
     * Removes a base IRI from the given absolute IRI.
     *
     * @param base the base IRI.
     * @param iri the absolute IRI.
     *
     * @return the relative IRI if relative to base, otherwise the absolute IRI.
     */
    api$9.removeBase = (base, iri) => {
      // skip IRI processing
      if(base === null) {
        return iri;
      }

      if(!base || types.isString(base)) {
        base = api$9.parse(base || '');
      }

      // establish base root
      let root = '';
      if(base.href !== '') {
        root += (base.protocol || '') + '//' + (base.authority || '');
      } else if(iri.indexOf('//')) {
        // support network-path reference with empty base
        root += '//';
      }

      // IRI not relative to base
      if(iri.indexOf(root) !== 0) {
        return iri;
      }

      // remove root from IRI and parse remainder
      const rel = api$9.parse(iri.substr(root.length));

      // remove path segments that match (do not remove last segment unless there
      // is a hash or query)
      const baseSegments = base.normalizedPath.split('/');
      const iriSegments = rel.normalizedPath.split('/');
      const last = (rel.fragment || rel.query) ? 0 : 1;
      while(baseSegments.length > 0 && iriSegments.length > last) {
        if(baseSegments[0] !== iriSegments[0]) {
          break;
        }
        baseSegments.shift();
        iriSegments.shift();
      }

      // use '../' for each non-matching base segment
      let rval = '';
      if(baseSegments.length > 0) {
        // don't count the last segment (if it ends with '/' last path doesn't
        // count and if it doesn't end with '/' it isn't a path)
        baseSegments.pop();
        for(let i = 0; i < baseSegments.length; ++i) {
          rval += '../';
        }
      }

      // prepend remaining segments
      rval += iriSegments.join('/');

      // add query and hash
      if(rel.query !== null) {
        rval += '?' + rel.query;
      }
      if(rel.fragment !== null) {
        rval += '#' + rel.fragment;
      }

      // handle empty base
      if(rval === '') {
        rval = './';
      }

      return rval;
    };

    /**
     * Removes dot segments from a URL path.
     *
     * @param path the path to remove dot segments from.
     */
    api$9.removeDotSegments = path => {
      // RFC 3986 5.2.4 (reworked)

      // empty path shortcut
      if(path.length === 0) {
        return '';
      }

      const input = path.split('/');
      const output = [];

      while(input.length > 0) {
        const next = input.shift();
        const done = input.length === 0;

        if(next === '.') {
          if(done) {
            // ensure output has trailing /
            output.push('');
          }
          continue;
        }

        if(next === '..') {
          output.pop();
          if(done) {
            // ensure output has trailing /
            output.push('');
          }
          continue;
        }

        output.push(next);
      }

      // if path was absolute, ensure output has leading /
      if(path[0] === '/' && output.length > 0 && output[0] !== '') {
        output.unshift('');
      }
      if(output.length === 1 && output[0] === '') {
        return '/';
      }

      return output.join('/');
    };

    // TODO: time better isAbsolute/isRelative checks using full regexes:
    // http://jmrware.com/articles/2009/uri_regexp/URI_regex.html

    // regex to check for absolute IRI (starting scheme and ':') or blank node IRI
    const isAbsoluteRegex = /^([A-Za-z][A-Za-z0-9+-.]*|_):[^\s]*$/;

    /**
     * Returns true if the given value is an absolute IRI or blank node IRI, false
     * if not.
     * Note: This weak check only checks for a correct starting scheme.
     *
     * @param v the value to check.
     *
     * @return true if the value is an absolute IRI, false if not.
     */
    api$9.isAbsolute = v => types.isString(v) && isAbsoluteRegex.test(v);

    /**
     * Returns true if the given value is a relative IRI, false if not.
     * Note: this is a weak check.
     *
     * @param v the value to check.
     *
     * @return true if the value is a relative IRI, false if not.
     */
    api$9.isRelative = v => types.isString(v);

    /*
     * Copyright (c) 2017 Digital Bazaar, Inc. All rights reserved.
     */

    const {parseLinkHeader, buildHeaders} = util;
    const {LINK_HEADER_CONTEXT} = constants;


    const {prependBase: prependBase$2} = url;

    const REGEX_LINK_HEADER = /(^|(\r\n))link:/i;

    /**
     * Creates a built-in XMLHttpRequest document loader.
     *
     * @param options the options to use:
     *          secure: require all URLs to use HTTPS.
     *          headers: an object (map) of headers which will be passed as request
     *            headers for the requested document. Accept is not allowed.
     *          [xhr]: the XMLHttpRequest API to use.
     *
     * @return the XMLHttpRequest document loader.
     */
    var xhr = ({
      secure,
      headers = {},
      xhr
    } = {headers: {}}) => {
      headers = buildHeaders(headers);
      const queue = new RequestQueue_1();
      return queue.wrapLoader(loader);

      async function loader(url) {
        if(url.indexOf('http:') !== 0 && url.indexOf('https:') !== 0) {
          throw new JsonLdError_1(
            'URL could not be dereferenced; only "http" and "https" URLs are ' +
            'supported.',
            'jsonld.InvalidUrl', {code: 'loading document failed', url});
        }
        if(secure && url.indexOf('https') !== 0) {
          throw new JsonLdError_1(
            'URL could not be dereferenced; secure mode is enabled and ' +
            'the URL\'s scheme is not "https".',
            'jsonld.InvalidUrl', {code: 'loading document failed', url});
        }

        let req;
        try {
          req = await _get(xhr, url, headers);
        } catch(e) {
          throw new JsonLdError_1(
            'URL could not be dereferenced, an error occurred.',
            'jsonld.LoadDocumentError',
            {code: 'loading document failed', url, cause: e});
        }

        if(req.status >= 400) {
          throw new JsonLdError_1(
            'URL could not be dereferenced: ' + req.statusText,
            'jsonld.LoadDocumentError', {
              code: 'loading document failed',
              url,
              httpStatusCode: req.status
            });
        }

        let doc = {contextUrl: null, documentUrl: url, document: req.response};
        let alternate = null;

        // handle Link Header (avoid unsafe header warning by existence testing)
        const contentType = req.getResponseHeader('Content-Type');
        let linkHeader;
        if(REGEX_LINK_HEADER.test(req.getAllResponseHeaders())) {
          linkHeader = req.getResponseHeader('Link');
        }
        if(linkHeader && contentType !== 'application/ld+json') {
          // only 1 related link header permitted
          const linkHeaders = parseLinkHeader(linkHeader);
          const linkedContext = linkHeaders[LINK_HEADER_CONTEXT];
          if(Array.isArray(linkedContext)) {
            throw new JsonLdError_1(
              'URL could not be dereferenced, it has more than one ' +
              'associated HTTP Link Header.',
              'jsonld.InvalidUrl',
              {code: 'multiple context link headers', url});
          }
          if(linkedContext) {
            doc.contextUrl = linkedContext.target;
          }

          // "alternate" link header is a redirect
          alternate = linkHeaders['alternate'];
          if(alternate &&
            alternate.type == 'application/ld+json' &&
            !(contentType || '').match(/^application\/(\w*\+)?json$/)) {
            doc = await loader(prependBase$2(url, alternate.target));
          }
        }

        return doc;
      }
    };

    function _get(xhr, url, headers) {
      xhr = xhr || XMLHttpRequest;
      const req = new xhr();
      return new Promise((resolve, reject) => {
        req.onload = () => resolve(req);
        req.onerror = err => reject(err);
        req.open('GET', url, true);
        for(const k in headers) {
          req.setRequestHeader(k, headers[k]);
        }
        req.send();
      });
    }

    /*
     * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
     */



    const api$8 = {};
    var platformBrowser = api$8;

    /**
     * Setup browser document loaders.
     *
     * @param jsonld the jsonld api.
     */
    api$8.setupDocumentLoaders = function(jsonld) {
      if(typeof XMLHttpRequest !== 'undefined') {
        jsonld.documentLoaders.xhr = xhr;
        // use xhr document loader by default
        jsonld.useDocumentLoader('xhr');
      }
    };

    /**
     * Setup browser globals.
     *
     * @param jsonld the jsonld api.
     */
    api$8.setupGlobals = function(jsonld) {
      // setup browser global JsonLdProcessor
      if(typeof globalThis.JsonLdProcessor === 'undefined') {
        Object.defineProperty(globalThis, 'JsonLdProcessor', {
          writable: true,
          enumerable: false,
          configurable: true,
          value: jsonld.JsonLdProcessor
        });
      }
    };

    var iterator = function (Yallist) {
      Yallist.prototype[Symbol.iterator] = function* () {
        for (let walker = this.head; walker; walker = walker.next) {
          yield walker.value;
        }
      };
    };

    var yallist = Yallist;

    Yallist.Node = Node;
    Yallist.create = Yallist;

    function Yallist (list) {
      var self = this;
      if (!(self instanceof Yallist)) {
        self = new Yallist();
      }

      self.tail = null;
      self.head = null;
      self.length = 0;

      if (list && typeof list.forEach === 'function') {
        list.forEach(function (item) {
          self.push(item);
        });
      } else if (arguments.length > 0) {
        for (var i = 0, l = arguments.length; i < l; i++) {
          self.push(arguments[i]);
        }
      }

      return self
    }

    Yallist.prototype.removeNode = function (node) {
      if (node.list !== this) {
        throw new Error('removing node which does not belong to this list')
      }

      var next = node.next;
      var prev = node.prev;

      if (next) {
        next.prev = prev;
      }

      if (prev) {
        prev.next = next;
      }

      if (node === this.head) {
        this.head = next;
      }
      if (node === this.tail) {
        this.tail = prev;
      }

      node.list.length--;
      node.next = null;
      node.prev = null;
      node.list = null;

      return next
    };

    Yallist.prototype.unshiftNode = function (node) {
      if (node === this.head) {
        return
      }

      if (node.list) {
        node.list.removeNode(node);
      }

      var head = this.head;
      node.list = this;
      node.next = head;
      if (head) {
        head.prev = node;
      }

      this.head = node;
      if (!this.tail) {
        this.tail = node;
      }
      this.length++;
    };

    Yallist.prototype.pushNode = function (node) {
      if (node === this.tail) {
        return
      }

      if (node.list) {
        node.list.removeNode(node);
      }

      var tail = this.tail;
      node.list = this;
      node.prev = tail;
      if (tail) {
        tail.next = node;
      }

      this.tail = node;
      if (!this.head) {
        this.head = node;
      }
      this.length++;
    };

    Yallist.prototype.push = function () {
      for (var i = 0, l = arguments.length; i < l; i++) {
        push(this, arguments[i]);
      }
      return this.length
    };

    Yallist.prototype.unshift = function () {
      for (var i = 0, l = arguments.length; i < l; i++) {
        unshift(this, arguments[i]);
      }
      return this.length
    };

    Yallist.prototype.pop = function () {
      if (!this.tail) {
        return undefined
      }

      var res = this.tail.value;
      this.tail = this.tail.prev;
      if (this.tail) {
        this.tail.next = null;
      } else {
        this.head = null;
      }
      this.length--;
      return res
    };

    Yallist.prototype.shift = function () {
      if (!this.head) {
        return undefined
      }

      var res = this.head.value;
      this.head = this.head.next;
      if (this.head) {
        this.head.prev = null;
      } else {
        this.tail = null;
      }
      this.length--;
      return res
    };

    Yallist.prototype.forEach = function (fn, thisp) {
      thisp = thisp || this;
      for (var walker = this.head, i = 0; walker !== null; i++) {
        fn.call(thisp, walker.value, i, this);
        walker = walker.next;
      }
    };

    Yallist.prototype.forEachReverse = function (fn, thisp) {
      thisp = thisp || this;
      for (var walker = this.tail, i = this.length - 1; walker !== null; i--) {
        fn.call(thisp, walker.value, i, this);
        walker = walker.prev;
      }
    };

    Yallist.prototype.get = function (n) {
      for (var i = 0, walker = this.head; walker !== null && i < n; i++) {
        // abort out of the list early if we hit a cycle
        walker = walker.next;
      }
      if (i === n && walker !== null) {
        return walker.value
      }
    };

    Yallist.prototype.getReverse = function (n) {
      for (var i = 0, walker = this.tail; walker !== null && i < n; i++) {
        // abort out of the list early if we hit a cycle
        walker = walker.prev;
      }
      if (i === n && walker !== null) {
        return walker.value
      }
    };

    Yallist.prototype.map = function (fn, thisp) {
      thisp = thisp || this;
      var res = new Yallist();
      for (var walker = this.head; walker !== null;) {
        res.push(fn.call(thisp, walker.value, this));
        walker = walker.next;
      }
      return res
    };

    Yallist.prototype.mapReverse = function (fn, thisp) {
      thisp = thisp || this;
      var res = new Yallist();
      for (var walker = this.tail; walker !== null;) {
        res.push(fn.call(thisp, walker.value, this));
        walker = walker.prev;
      }
      return res
    };

    Yallist.prototype.reduce = function (fn, initial) {
      var acc;
      var walker = this.head;
      if (arguments.length > 1) {
        acc = initial;
      } else if (this.head) {
        walker = this.head.next;
        acc = this.head.value;
      } else {
        throw new TypeError('Reduce of empty list with no initial value')
      }

      for (var i = 0; walker !== null; i++) {
        acc = fn(acc, walker.value, i);
        walker = walker.next;
      }

      return acc
    };

    Yallist.prototype.reduceReverse = function (fn, initial) {
      var acc;
      var walker = this.tail;
      if (arguments.length > 1) {
        acc = initial;
      } else if (this.tail) {
        walker = this.tail.prev;
        acc = this.tail.value;
      } else {
        throw new TypeError('Reduce of empty list with no initial value')
      }

      for (var i = this.length - 1; walker !== null; i--) {
        acc = fn(acc, walker.value, i);
        walker = walker.prev;
      }

      return acc
    };

    Yallist.prototype.toArray = function () {
      var arr = new Array(this.length);
      for (var i = 0, walker = this.head; walker !== null; i++) {
        arr[i] = walker.value;
        walker = walker.next;
      }
      return arr
    };

    Yallist.prototype.toArrayReverse = function () {
      var arr = new Array(this.length);
      for (var i = 0, walker = this.tail; walker !== null; i++) {
        arr[i] = walker.value;
        walker = walker.prev;
      }
      return arr
    };

    Yallist.prototype.slice = function (from, to) {
      to = to || this.length;
      if (to < 0) {
        to += this.length;
      }
      from = from || 0;
      if (from < 0) {
        from += this.length;
      }
      var ret = new Yallist();
      if (to < from || to < 0) {
        return ret
      }
      if (from < 0) {
        from = 0;
      }
      if (to > this.length) {
        to = this.length;
      }
      for (var i = 0, walker = this.head; walker !== null && i < from; i++) {
        walker = walker.next;
      }
      for (; walker !== null && i < to; i++, walker = walker.next) {
        ret.push(walker.value);
      }
      return ret
    };

    Yallist.prototype.sliceReverse = function (from, to) {
      to = to || this.length;
      if (to < 0) {
        to += this.length;
      }
      from = from || 0;
      if (from < 0) {
        from += this.length;
      }
      var ret = new Yallist();
      if (to < from || to < 0) {
        return ret
      }
      if (from < 0) {
        from = 0;
      }
      if (to > this.length) {
        to = this.length;
      }
      for (var i = this.length, walker = this.tail; walker !== null && i > to; i--) {
        walker = walker.prev;
      }
      for (; walker !== null && i > from; i--, walker = walker.prev) {
        ret.push(walker.value);
      }
      return ret
    };

    Yallist.prototype.splice = function (start, deleteCount, ...nodes) {
      if (start > this.length) {
        start = this.length - 1;
      }
      if (start < 0) {
        start = this.length + start;
      }

      for (var i = 0, walker = this.head; walker !== null && i < start; i++) {
        walker = walker.next;
      }

      var ret = [];
      for (var i = 0; walker && i < deleteCount; i++) {
        ret.push(walker.value);
        walker = this.removeNode(walker);
      }
      if (walker === null) {
        walker = this.tail;
      }

      if (walker !== this.head && walker !== this.tail) {
        walker = walker.prev;
      }

      for (var i = 0; i < nodes.length; i++) {
        walker = insert(this, walker, nodes[i]);
      }
      return ret;
    };

    Yallist.prototype.reverse = function () {
      var head = this.head;
      var tail = this.tail;
      for (var walker = head; walker !== null; walker = walker.prev) {
        var p = walker.prev;
        walker.prev = walker.next;
        walker.next = p;
      }
      this.head = tail;
      this.tail = head;
      return this
    };

    function insert (self, node, value) {
      var inserted = node === self.head ?
        new Node(value, null, node, self) :
        new Node(value, node, node.next, self);

      if (inserted.next === null) {
        self.tail = inserted;
      }
      if (inserted.prev === null) {
        self.head = inserted;
      }

      self.length++;

      return inserted
    }

    function push (self, item) {
      self.tail = new Node(item, self.tail, null, self);
      if (!self.head) {
        self.head = self.tail;
      }
      self.length++;
    }

    function unshift (self, item) {
      self.head = new Node(item, null, self.head, self);
      if (!self.tail) {
        self.tail = self.head;
      }
      self.length++;
    }

    function Node (value, prev, next, list) {
      if (!(this instanceof Node)) {
        return new Node(value, prev, next, list)
      }

      this.list = list;
      this.value = value;

      if (prev) {
        prev.next = this;
        this.prev = prev;
      } else {
        this.prev = null;
      }

      if (next) {
        next.prev = this;
        this.next = next;
      } else {
        this.next = null;
      }
    }

    try {
      // add if support for Symbol.iterator is present
      iterator(Yallist);
    } catch (er) {}

    // A linked list to keep track of recently-used-ness


    const MAX = Symbol('max');
    const LENGTH = Symbol('length');
    const LENGTH_CALCULATOR = Symbol('lengthCalculator');
    const ALLOW_STALE = Symbol('allowStale');
    const MAX_AGE = Symbol('maxAge');
    const DISPOSE = Symbol('dispose');
    const NO_DISPOSE_ON_SET = Symbol('noDisposeOnSet');
    const LRU_LIST = Symbol('lruList');
    const CACHE = Symbol('cache');
    const UPDATE_AGE_ON_GET = Symbol('updateAgeOnGet');

    const naiveLength = () => 1;

    // lruList is a yallist where the head is the youngest
    // item, and the tail is the oldest.  the list contains the Hit
    // objects as the entries.
    // Each Hit object has a reference to its Yallist.Node.  This
    // never changes.
    //
    // cache is a Map (or PseudoMap) that matches the keys to
    // the Yallist.Node object.
    class LRUCache {
      constructor (options) {
        if (typeof options === 'number')
          options = { max: options };

        if (!options)
          options = {};

        if (options.max && (typeof options.max !== 'number' || options.max < 0))
          throw new TypeError('max must be a non-negative number')
        // Kind of weird to have a default max of Infinity, but oh well.
        this[MAX] = options.max || Infinity;

        const lc = options.length || naiveLength;
        this[LENGTH_CALCULATOR] = (typeof lc !== 'function') ? naiveLength : lc;
        this[ALLOW_STALE] = options.stale || false;
        if (options.maxAge && typeof options.maxAge !== 'number')
          throw new TypeError('maxAge must be a number')
        this[MAX_AGE] = options.maxAge || 0;
        this[DISPOSE] = options.dispose;
        this[NO_DISPOSE_ON_SET] = options.noDisposeOnSet || false;
        this[UPDATE_AGE_ON_GET] = options.updateAgeOnGet || false;
        this.reset();
      }

      // resize the cache when the max changes.
      set max (mL) {
        if (typeof mL !== 'number' || mL < 0)
          throw new TypeError('max must be a non-negative number')

        this[MAX] = mL || Infinity;
        trim(this);
      }
      get max () {
        return this[MAX]
      }

      set allowStale (allowStale) {
        this[ALLOW_STALE] = !!allowStale;
      }
      get allowStale () {
        return this[ALLOW_STALE]
      }

      set maxAge (mA) {
        if (typeof mA !== 'number')
          throw new TypeError('maxAge must be a non-negative number')

        this[MAX_AGE] = mA;
        trim(this);
      }
      get maxAge () {
        return this[MAX_AGE]
      }

      // resize the cache when the lengthCalculator changes.
      set lengthCalculator (lC) {
        if (typeof lC !== 'function')
          lC = naiveLength;

        if (lC !== this[LENGTH_CALCULATOR]) {
          this[LENGTH_CALCULATOR] = lC;
          this[LENGTH] = 0;
          this[LRU_LIST].forEach(hit => {
            hit.length = this[LENGTH_CALCULATOR](hit.value, hit.key);
            this[LENGTH] += hit.length;
          });
        }
        trim(this);
      }
      get lengthCalculator () { return this[LENGTH_CALCULATOR] }

      get length () { return this[LENGTH] }
      get itemCount () { return this[LRU_LIST].length }

      rforEach (fn, thisp) {
        thisp = thisp || this;
        for (let walker = this[LRU_LIST].tail; walker !== null;) {
          const prev = walker.prev;
          forEachStep(this, fn, walker, thisp);
          walker = prev;
        }
      }

      forEach (fn, thisp) {
        thisp = thisp || this;
        for (let walker = this[LRU_LIST].head; walker !== null;) {
          const next = walker.next;
          forEachStep(this, fn, walker, thisp);
          walker = next;
        }
      }

      keys () {
        return this[LRU_LIST].toArray().map(k => k.key)
      }

      values () {
        return this[LRU_LIST].toArray().map(k => k.value)
      }

      reset () {
        if (this[DISPOSE] &&
            this[LRU_LIST] &&
            this[LRU_LIST].length) {
          this[LRU_LIST].forEach(hit => this[DISPOSE](hit.key, hit.value));
        }

        this[CACHE] = new Map(); // hash of items by key
        this[LRU_LIST] = new yallist(); // list of items in order of use recency
        this[LENGTH] = 0; // length of items in the list
      }

      dump () {
        return this[LRU_LIST].map(hit =>
          isStale(this, hit) ? false : {
            k: hit.key,
            v: hit.value,
            e: hit.now + (hit.maxAge || 0)
          }).toArray().filter(h => h)
      }

      dumpLru () {
        return this[LRU_LIST]
      }

      set (key, value, maxAge) {
        maxAge = maxAge || this[MAX_AGE];

        if (maxAge && typeof maxAge !== 'number')
          throw new TypeError('maxAge must be a number')

        const now = maxAge ? Date.now() : 0;
        const len = this[LENGTH_CALCULATOR](value, key);

        if (this[CACHE].has(key)) {
          if (len > this[MAX]) {
            del(this, this[CACHE].get(key));
            return false
          }

          const node = this[CACHE].get(key);
          const item = node.value;

          // dispose of the old one before overwriting
          // split out into 2 ifs for better coverage tracking
          if (this[DISPOSE]) {
            if (!this[NO_DISPOSE_ON_SET])
              this[DISPOSE](key, item.value);
          }

          item.now = now;
          item.maxAge = maxAge;
          item.value = value;
          this[LENGTH] += len - item.length;
          item.length = len;
          this.get(key);
          trim(this);
          return true
        }

        const hit = new Entry(key, value, len, now, maxAge);

        // oversized objects fall out of cache automatically.
        if (hit.length > this[MAX]) {
          if (this[DISPOSE])
            this[DISPOSE](key, value);

          return false
        }

        this[LENGTH] += hit.length;
        this[LRU_LIST].unshift(hit);
        this[CACHE].set(key, this[LRU_LIST].head);
        trim(this);
        return true
      }

      has (key) {
        if (!this[CACHE].has(key)) return false
        const hit = this[CACHE].get(key).value;
        return !isStale(this, hit)
      }

      get (key) {
        return get(this, key, true)
      }

      peek (key) {
        return get(this, key, false)
      }

      pop () {
        const node = this[LRU_LIST].tail;
        if (!node)
          return null

        del(this, node);
        return node.value
      }

      del (key) {
        del(this, this[CACHE].get(key));
      }

      load (arr) {
        // reset the cache
        this.reset();

        const now = Date.now();
        // A previous serialized cache has the most recent items first
        for (let l = arr.length - 1; l >= 0; l--) {
          const hit = arr[l];
          const expiresAt = hit.e || 0;
          if (expiresAt === 0)
            // the item was created without expiration in a non aged cache
            this.set(hit.k, hit.v);
          else {
            const maxAge = expiresAt - now;
            // dont add already expired items
            if (maxAge > 0) {
              this.set(hit.k, hit.v, maxAge);
            }
          }
        }
      }

      prune () {
        this[CACHE].forEach((value, key) => get(this, key, false));
      }
    }

    const get = (self, key, doUse) => {
      const node = self[CACHE].get(key);
      if (node) {
        const hit = node.value;
        if (isStale(self, hit)) {
          del(self, node);
          if (!self[ALLOW_STALE])
            return undefined
        } else {
          if (doUse) {
            if (self[UPDATE_AGE_ON_GET])
              node.value.now = Date.now();
            self[LRU_LIST].unshiftNode(node);
          }
        }
        return hit.value
      }
    };

    const isStale = (self, hit) => {
      if (!hit || (!hit.maxAge && !self[MAX_AGE]))
        return false

      const diff = Date.now() - hit.now;
      return hit.maxAge ? diff > hit.maxAge
        : self[MAX_AGE] && (diff > self[MAX_AGE])
    };

    const trim = self => {
      if (self[LENGTH] > self[MAX]) {
        for (let walker = self[LRU_LIST].tail;
          self[LENGTH] > self[MAX] && walker !== null;) {
          // We know that we're about to delete this one, and also
          // what the next least recently used key will be, so just
          // go ahead and set it now.
          const prev = walker.prev;
          del(self, walker);
          walker = prev;
        }
      }
    };

    const del = (self, node) => {
      if (node) {
        const hit = node.value;
        if (self[DISPOSE])
          self[DISPOSE](hit.key, hit.value);

        self[LENGTH] -= hit.length;
        self[CACHE].delete(hit.key);
        self[LRU_LIST].removeNode(node);
      }
    };

    class Entry {
      constructor (key, value, length, now, maxAge) {
        this.key = key;
        this.value = value;
        this.length = length;
        this.now = now;
        this.maxAge = maxAge || 0;
      }
    }

    const forEachStep = (self, fn, node, thisp) => {
      let hit = node.value;
      if (isStale(self, hit)) {
        del(self, node);
        if (!self[ALLOW_STALE])
          hit = undefined;
      }
      if (hit)
        fn.call(thisp, hit.value, hit.key, self);
    };

    var lruCache = LRUCache;

    /*
     * Copyright (c) 2019 Digital Bazaar, Inc. All rights reserved.
     */



    const MAX_ACTIVE_CONTEXTS = 10;

    var ResolvedContext_1 = class ResolvedContext {
      /**
       * Creates a ResolvedContext.
       *
       * @param document the context document.
       */
      constructor({document}) {
        this.document = document;
        // TODO: enable customization of processed context cache
        // TODO: limit based on size of processed contexts vs. number of them
        this.cache = new lruCache({max: MAX_ACTIVE_CONTEXTS});
      }

      getProcessed(activeCtx) {
        return this.cache.get(activeCtx);
      }

      setProcessed(activeCtx, processedCtx) {
        this.cache.set(activeCtx, processedCtx);
      }
    };

    /*
     * Copyright (c) 2019 Digital Bazaar, Inc. All rights reserved.
     */

    const {
      isArray: _isArray$4,
      isObject: _isObject$4,
      isString: _isString$4,
    } = types;
    const {
      asArray: _asArray$3
    } = util;
    const {prependBase: prependBase$1} = url;



    const MAX_CONTEXT_URLS = 10;

    var ContextResolver_1 = class ContextResolver {
      /**
       * Creates a ContextResolver.
       *
       * @param sharedCache a shared LRU cache with `get` and `set` APIs.
       */
      constructor({sharedCache}) {
        this.perOpCache = new Map();
        this.sharedCache = sharedCache;
      }

      async resolve({
        activeCtx, context, documentLoader, base, cycles = new Set()
      }) {
        // process `@context`
        if(context && _isObject$4(context) && context['@context']) {
          context = context['@context'];
        }

        // context is one or more contexts
        context = _asArray$3(context);

        // resolve each context in the array
        const allResolved = [];
        for(const ctx of context) {
          if(_isString$4(ctx)) {
            // see if `ctx` has been resolved before...
            let resolved = this._get(ctx);
            if(!resolved) {
              // not resolved yet, resolve
              resolved = await this._resolveRemoteContext(
                {activeCtx, url: ctx, documentLoader, base, cycles});
            }

            // add to output and continue
            if(_isArray$4(resolved)) {
              allResolved.push(...resolved);
            } else {
              allResolved.push(resolved);
            }
            continue;
          }
          if(ctx === null) {
            // handle `null` context, nothing to cache
            allResolved.push(new ResolvedContext_1({document: null}));
            continue;
          }
          if(!_isObject$4(ctx)) {
            _throwInvalidLocalContext(context);
          }
          // context is an object, get/create `ResolvedContext` for it
          const key = JSON.stringify(ctx);
          let resolved = this._get(key);
          if(!resolved) {
            // create a new static `ResolvedContext` and cache it
            resolved = new ResolvedContext_1({document: ctx});
            this._cacheResolvedContext({key, resolved, tag: 'static'});
          }
          allResolved.push(resolved);
        }

        return allResolved;
      }

      _get(key) {
        // get key from per operation cache; no `tag` is used with this cache so
        // any retrieved context will always be the same during a single operation
        let resolved = this.perOpCache.get(key);
        if(!resolved) {
          // see if the shared cache has a `static` entry for this URL
          const tagMap = this.sharedCache.get(key);
          if(tagMap) {
            resolved = tagMap.get('static');
            if(resolved) {
              this.perOpCache.set(key, resolved);
            }
          }
        }
        return resolved;
      }

      _cacheResolvedContext({key, resolved, tag}) {
        this.perOpCache.set(key, resolved);
        if(tag !== undefined) {
          let tagMap = this.sharedCache.get(key);
          if(!tagMap) {
            tagMap = new Map();
            this.sharedCache.set(key, tagMap);
          }
          tagMap.set(tag, resolved);
        }
        return resolved;
      }

      async _resolveRemoteContext({activeCtx, url, documentLoader, base, cycles}) {
        // resolve relative URL and fetch context
        url = prependBase$1(base, url);
        const {context, remoteDoc} = await this._fetchContext(
          {activeCtx, url, documentLoader, cycles});

        // update base according to remote document and resolve any relative URLs
        base = remoteDoc.documentUrl || url;
        _resolveContextUrls({context, base});

        // resolve, cache, and return context
        const resolved = await this.resolve(
          {activeCtx, context, documentLoader, base, cycles});
        this._cacheResolvedContext({key: url, resolved, tag: remoteDoc.tag});
        return resolved;
      }

      async _fetchContext({activeCtx, url, documentLoader, cycles}) {
        // check for max context URLs fetched during a resolve operation
        if(cycles.size > MAX_CONTEXT_URLS) {
          throw new JsonLdError_1(
            'Maximum number of @context URLs exceeded.',
            'jsonld.ContextUrlError',
            {
              code: activeCtx.processingMode === 'json-ld-1.0' ?
                'loading remote context failed' :
                'context overflow',
              max: MAX_CONTEXT_URLS
            });
        }

        // check for context URL cycle
        // shortcut to avoid extra work that would eventually hit the max above
        if(cycles.has(url)) {
          throw new JsonLdError_1(
            'Cyclical @context URLs detected.',
            'jsonld.ContextUrlError',
            {
              code: activeCtx.processingMode === 'json-ld-1.0' ?
                'recursive context inclusion' :
                'context overflow',
              url
            });
        }

        // track cycles
        cycles.add(url);

        let context;
        let remoteDoc;

        try {
          remoteDoc = await documentLoader(url);
          context = remoteDoc.document || null;
          // parse string context as JSON
          if(_isString$4(context)) {
            context = JSON.parse(context);
          }
        } catch(e) {
          throw new JsonLdError_1(
            'Dereferencing a URL did not result in a valid JSON-LD object. ' +
            'Possible causes are an inaccessible URL perhaps due to ' +
            'a same-origin policy (ensure the server uses CORS if you are ' +
            'using client-side JavaScript), too many redirects, a ' +
            'non-JSON response, or more than one HTTP Link Header was ' +
            'provided for a remote context.',
            'jsonld.InvalidUrl',
            {code: 'loading remote context failed', url, cause: e});
        }

        // ensure ctx is an object
        if(!_isObject$4(context)) {
          throw new JsonLdError_1(
            'Dereferencing a URL did not result in a JSON object. The ' +
            'response was valid JSON, but it was not a JSON object.',
            'jsonld.InvalidUrl', {code: 'invalid remote context', url});
        }

        // use empty context if no @context key is present
        if(!('@context' in context)) {
          context = {'@context': {}};
        } else {
          context = {'@context': context['@context']};
        }

        // append @context URL to context if given
        if(remoteDoc.contextUrl) {
          if(!_isArray$4(context['@context'])) {
            context['@context'] = [context['@context']];
          }
          context['@context'].push(remoteDoc.contextUrl);
        }

        return {context, remoteDoc};
      }
    };

    function _throwInvalidLocalContext(ctx) {
      throw new JsonLdError_1(
        'Invalid JSON-LD syntax; @context must be an object.',
        'jsonld.SyntaxError', {
          code: 'invalid local context', context: ctx
        });
    }

    /**
     * Resolve all relative `@context` URLs in the given context by inline
     * replacing them with absolute URLs.
     *
     * @param context the context.
     * @param base the base IRI to use to resolve relative IRIs.
     */
    function _resolveContextUrls({context, base}) {
      if(!context) {
        return;
      }

      const ctx = context['@context'];

      if(_isString$4(ctx)) {
        context['@context'] = prependBase$1(base, ctx);
        return;
      }

      if(_isArray$4(ctx)) {
        for(let i = 0; i < ctx.length; ++i) {
          const element = ctx[i];
          if(_isString$4(element)) {
            ctx[i] = prependBase$1(base, element);
            continue;
          }
          if(_isObject$4(element)) {
            _resolveContextUrls({context: {'@context': element}, base});
          }
        }
        return;
      }

      if(!_isObject$4(ctx)) {
        // no @context URLs can be found in non-object
        return;
      }

      // ctx is an object, resolve any context URLs in terms
      for(const term in ctx) {
        _resolveContextUrls({context: ctx[term], base});
      }
    }

    /*
     * Copyright (c) 2017 Digital Bazaar, Inc. All rights reserved.
     */

    // TODO: move `NQuads` to its own package
    var NQuads = rdfCanonize.NQuads;

    /*
     * Copyright (c) 2017-2019 Digital Bazaar, Inc. All rights reserved.
     */




    const {
      isArray: _isArray$3,
      isObject: _isObject$3,
      isString: _isString$3,
      isUndefined: _isUndefined$2
    } = types;

    const {
      isAbsolute: _isAbsoluteIri$2,
      isRelative: _isRelativeIri,
      prependBase
    } = url;

    const {
      asArray: _asArray$2,
      compareShortestLeast: _compareShortestLeast$1
    } = util;

    const INITIAL_CONTEXT_CACHE = new Map();
    const INITIAL_CONTEXT_CACHE_MAX_SIZE = 10000;
    const KEYWORD_PATTERN = /^@[a-zA-Z]+$/;

    const api$7 = {};
    var context = api$7;

    /**
     * Processes a local context and returns a new active context.
     *
     * @param activeCtx the current active context.
     * @param localCtx the local context to process.
     * @param options the context processing options.
     * @param propagate `true` if `false`, retains any previously defined term,
     *   which can be rolled back when the descending into a new node object.
     * @param overrideProtected `false` allows protected terms to be modified.
     *
     * @return a Promise that resolves to the new active context.
     */
    api$7.process = async ({
      activeCtx, localCtx, options,
      propagate = true,
      overrideProtected = false,
      cycles = new Set()
    }) => {
      // normalize local context to an array of @context objects
      if(_isObject$3(localCtx) && '@context' in localCtx &&
        _isArray$3(localCtx['@context'])) {
        localCtx = localCtx['@context'];
      }
      const ctxs = _asArray$2(localCtx);

      // no contexts in array, return current active context w/o changes
      if(ctxs.length === 0) {
        return activeCtx;
      }

      // resolve contexts
      const resolved = await options.contextResolver.resolve({
        activeCtx,
        context: localCtx,
        documentLoader: options.documentLoader,
        base: options.base
      });

      // override propagate if first resolved context has `@propagate`
      if(_isObject$3(resolved[0].document) &&
        typeof resolved[0].document['@propagate'] === 'boolean') {
        // retrieve early, error checking done later
        propagate = resolved[0].document['@propagate'];
      }

      // process each context in order, update active context
      // on each iteration to ensure proper caching
      let rval = activeCtx;

      // track the previous context
      // if not propagating, make sure rval has a previous context
      if(!propagate && !rval.previousContext) {
        // clone `rval` context before updating
        rval = rval.clone();
        rval.previousContext = activeCtx;
      }

      for(const resolvedContext of resolved) {
        let {document: ctx} = resolvedContext;

        // update active context to one computed from last iteration
        activeCtx = rval;

        // reset to initial context
        if(ctx === null) {
          // We can't nullify if there are protected terms and we're
          // not allowing overrides (e.g. processing a property term scoped context)
          if(!overrideProtected &&
            Object.keys(activeCtx.protected).length !== 0) {
            const protectedMode = (options && options.protectedMode) || 'error';
            if(protectedMode === 'error') {
              throw new JsonLdError_1(
                'Tried to nullify a context with protected terms outside of ' +
                'a term definition.',
                'jsonld.SyntaxError',
                {code: 'invalid context nullification'});
            } else if(protectedMode === 'warn') {
              // FIXME: remove logging and use a handler
              console.warn('WARNING: invalid context nullification');

              // get processed context from cache if available
              const processed = resolvedContext.getProcessed(activeCtx);
              if(processed) {
                rval = activeCtx = processed;
                continue;
              }

              const oldActiveCtx = activeCtx;
              // copy all protected term definitions to fresh initial context
              rval = activeCtx = api$7.getInitialContext(options).clone();
              for(const [term, _protected] of
                Object.entries(oldActiveCtx.protected)) {
                if(_protected) {
                  activeCtx.mappings[term] =
                    util.clone(oldActiveCtx.mappings[term]);
                }
              }
              activeCtx.protected = util.clone(oldActiveCtx.protected);

              // cache processed result
              resolvedContext.setProcessed(oldActiveCtx, rval);
              continue;
            }
            throw new JsonLdError_1(
              'Invalid protectedMode.',
              'jsonld.SyntaxError',
              {code: 'invalid protected mode', context: localCtx, protectedMode});
          }
          rval = activeCtx = api$7.getInitialContext(options).clone();
          continue;
        }

        // get processed context from cache if available
        const processed = resolvedContext.getProcessed(activeCtx);
        if(processed) {
          rval = activeCtx = processed;
          continue;
        }

        // dereference @context key if present
        if(_isObject$3(ctx) && '@context' in ctx) {
          ctx = ctx['@context'];
        }

        // context must be an object by now, all URLs retrieved before this call
        if(!_isObject$3(ctx)) {
          throw new JsonLdError_1(
            'Invalid JSON-LD syntax; @context must be an object.',
            'jsonld.SyntaxError', {code: 'invalid local context', context: ctx});
        }

        // TODO: there is likely a `previousContext` cloning optimization that
        // could be applied here (no need to copy it under certain conditions)

        // clone context before updating it
        rval = rval.clone();

        // define context mappings for keys in local context
        const defined = new Map();

        // handle @version
        if('@version' in ctx) {
          if(ctx['@version'] !== 1.1) {
            throw new JsonLdError_1(
              'Unsupported JSON-LD version: ' + ctx['@version'],
              'jsonld.UnsupportedVersion',
              {code: 'invalid @version value', context: ctx});
          }
          if(activeCtx.processingMode &&
            activeCtx.processingMode === 'json-ld-1.0') {
            throw new JsonLdError_1(
              '@version: ' + ctx['@version'] + ' not compatible with ' +
              activeCtx.processingMode,
              'jsonld.ProcessingModeConflict',
              {code: 'processing mode conflict', context: ctx});
          }
          rval.processingMode = 'json-ld-1.1';
          rval['@version'] = ctx['@version'];
          defined.set('@version', true);
        }

        // if not set explicitly, set processingMode to "json-ld-1.1"
        rval.processingMode =
          rval.processingMode || activeCtx.processingMode;

        // handle @base
        if('@base' in ctx) {
          let base = ctx['@base'];

          if(base === null || _isAbsoluteIri$2(base)) ; else if(_isRelativeIri(base)) {
            base = prependBase(rval['@base'], base);
          } else {
            throw new JsonLdError_1(
              'Invalid JSON-LD syntax; the value of "@base" in a ' +
              '@context must be an absolute IRI, a relative IRI, or null.',
              'jsonld.SyntaxError', {code: 'invalid base IRI', context: ctx});
          }

          rval['@base'] = base;
          defined.set('@base', true);
        }

        // handle @vocab
        if('@vocab' in ctx) {
          const value = ctx['@vocab'];
          if(value === null) {
            delete rval['@vocab'];
          } else if(!_isString$3(value)) {
            throw new JsonLdError_1(
              'Invalid JSON-LD syntax; the value of "@vocab" in a ' +
              '@context must be a string or null.',
              'jsonld.SyntaxError', {code: 'invalid vocab mapping', context: ctx});
          } else if(!_isAbsoluteIri$2(value) && api$7.processingMode(rval, 1.0)) {
            throw new JsonLdError_1(
              'Invalid JSON-LD syntax; the value of "@vocab" in a ' +
              '@context must be an absolute IRI.',
              'jsonld.SyntaxError', {code: 'invalid vocab mapping', context: ctx});
          } else {
            rval['@vocab'] = _expandIri$3(rval, value, {vocab: true, base: true},
              undefined, undefined, options);
          }
          defined.set('@vocab', true);
        }

        // handle @language
        if('@language' in ctx) {
          const value = ctx['@language'];
          if(value === null) {
            delete rval['@language'];
          } else if(!_isString$3(value)) {
            throw new JsonLdError_1(
              'Invalid JSON-LD syntax; the value of "@language" in a ' +
              '@context must be a string or null.',
              'jsonld.SyntaxError',
              {code: 'invalid default language', context: ctx});
          } else {
            rval['@language'] = value.toLowerCase();
          }
          defined.set('@language', true);
        }

        // handle @direction
        if('@direction' in ctx) {
          const value = ctx['@direction'];
          if(activeCtx.processingMode === 'json-ld-1.0') {
            throw new JsonLdError_1(
              'Invalid JSON-LD syntax; @direction not compatible with ' +
              activeCtx.processingMode,
              'jsonld.SyntaxError',
              {code: 'invalid context member', context: ctx});
          }
          if(value === null) {
            delete rval['@direction'];
          } else if(value !== 'ltr' && value !== 'rtl') {
            throw new JsonLdError_1(
              'Invalid JSON-LD syntax; the value of "@direction" in a ' +
              '@context must be null, "ltr", or "rtl".',
              'jsonld.SyntaxError',
              {code: 'invalid base direction', context: ctx});
          } else {
            rval['@direction'] = value;
          }
          defined.set('@direction', true);
        }

        // handle @propagate
        // note: we've already extracted it, here we just do error checking
        if('@propagate' in ctx) {
          const value = ctx['@propagate'];
          if(activeCtx.processingMode === 'json-ld-1.0') {
            throw new JsonLdError_1(
              'Invalid JSON-LD syntax; @propagate not compatible with ' +
              activeCtx.processingMode,
              'jsonld.SyntaxError',
              {code: 'invalid context entry', context: ctx});
          }
          if(typeof value !== 'boolean') {
            throw new JsonLdError_1(
              'Invalid JSON-LD syntax; @propagate value must be a boolean.',
              'jsonld.SyntaxError',
              {code: 'invalid @propagate value', context: localCtx});
          }
          defined.set('@propagate', true);
        }

        // handle @import
        if('@import' in ctx) {
          const value = ctx['@import'];
          if(activeCtx.processingMode === 'json-ld-1.0') {
            throw new JsonLdError_1(
              'Invalid JSON-LD syntax; @import not compatible with ' +
              activeCtx.processingMode,
              'jsonld.SyntaxError',
              {code: 'invalid context entry', context: ctx});
          }
          if(!_isString$3(value)) {
            throw new JsonLdError_1(
              'Invalid JSON-LD syntax; @import must be a string.',
              'jsonld.SyntaxError',
              {code: 'invalid @import value', context: localCtx});
          }

          // resolve contexts
          const resolvedImport = await options.contextResolver.resolve({
            activeCtx,
            context: value,
            documentLoader: options.documentLoader,
            base: options.base
          });
          if(resolvedImport.length !== 1) {
            throw new JsonLdError_1(
              'Invalid JSON-LD syntax; @import must reference a single context.',
              'jsonld.SyntaxError',
              {code: 'invalid remote context', context: localCtx});
          }
          const processedImport = resolvedImport[0].getProcessed(activeCtx);
          if(processedImport) {
            // Note: if the same context were used in this active context
            // as a reference context, then processed_input might not
            // be a dict.
            ctx = processedImport;
          } else {
            const importCtx = resolvedImport[0].document;
            if('@import' in importCtx) {
              throw new JsonLdError_1(
                'Invalid JSON-LD syntax: ' +
                'imported context must not include @import.',
                'jsonld.SyntaxError',
                {code: 'invalid context entry', context: localCtx});
            }

            // merge ctx into importCtx and replace rval with the result
            for(const key in importCtx) {
              if(!ctx.hasOwnProperty(key)) {
                ctx[key] = importCtx[key];
              }
            }

            // Note: this could potenially conflict if the import
            // were used in the same active context as a referenced
            // context and an import. In this case, we
            // could override the cached result, but seems unlikely.
            resolvedImport[0].setProcessed(activeCtx, ctx);
          }

          defined.set('@import', true);
        }

        // handle @protected; determine whether this sub-context is declaring
        // all its terms to be "protected" (exceptions can be made on a
        // per-definition basis)
        defined.set('@protected', ctx['@protected'] || false);

        // process all other keys
        for(const key in ctx) {
          api$7.createTermDefinition({
            activeCtx: rval,
            localCtx: ctx,
            term: key,
            defined,
            options,
            overrideProtected
          });

          if(_isObject$3(ctx[key]) && '@context' in ctx[key]) {
            const keyCtx = ctx[key]['@context'];
            let process = true;
            if(_isString$3(keyCtx)) {
              const url = prependBase(options.base, keyCtx);
              // track processed contexts to avoid scoped context recursion
              if(cycles.has(url)) {
                process = false;
              } else {
                cycles.add(url);
              }
            }
            // parse context to validate
            if(process) {
              try {
                await api$7.process({
                  activeCtx: rval.clone(),
                  localCtx: ctx[key]['@context'],
                  overrideProtected: true,
                  options,
                  cycles
                });
              } catch(e) {
                throw new JsonLdError_1(
                  'Invalid JSON-LD syntax; invalid scoped context.',
                  'jsonld.SyntaxError',
                  {
                    code: 'invalid scoped context',
                    context: ctx[key]['@context'],
                    term: key
                  });
              }
            }
          }
        }

        // cache processed result
        resolvedContext.setProcessed(activeCtx, rval);
      }

      return rval;
    };

    /**
     * Creates a term definition during context processing.
     *
     * @param activeCtx the current active context.
     * @param localCtx the local context being processed.
     * @param term the term in the local context to define the mapping for.
     * @param defined a map of defining/defined keys to detect cycles and prevent
     *          double definitions.
     * @param {Object} [options] - creation options.
     * @param {string} [options.protectedMode="error"] - "error" to throw error
     *   on `@protected` constraint violation, "warn" to allow violations and
     *   signal a warning.
     * @param overrideProtected `false` allows protected terms to be modified.
     */
    api$7.createTermDefinition = ({
      activeCtx,
      localCtx,
      term,
      defined,
      options,
      overrideProtected = false,
    }) => {
      if(defined.has(term)) {
        // term already defined
        if(defined.get(term)) {
          return;
        }
        // cycle detected
        throw new JsonLdError_1(
          'Cyclical context definition detected.',
          'jsonld.CyclicalContext',
          {code: 'cyclic IRI mapping', context: localCtx, term});
      }

      // now defining term
      defined.set(term, false);

      // get context term value
      let value;
      if(localCtx.hasOwnProperty(term)) {
        value = localCtx[term];
      }

      if(term === '@type' &&
         _isObject$3(value) &&
         (value['@container'] || '@set') === '@set' &&
         api$7.processingMode(activeCtx, 1.1)) {

        const validKeys = ['@container', '@id', '@protected'];
        const keys = Object.keys(value);
        if(keys.length === 0 || keys.some(k => !validKeys.includes(k))) {
          throw new JsonLdError_1(
            'Invalid JSON-LD syntax; keywords cannot be overridden.',
            'jsonld.SyntaxError',
            {code: 'keyword redefinition', context: localCtx, term});
        }
      } else if(api$7.isKeyword(term)) {
        throw new JsonLdError_1(
          'Invalid JSON-LD syntax; keywords cannot be overridden.',
          'jsonld.SyntaxError',
          {code: 'keyword redefinition', context: localCtx, term});
      } else if(term.match(KEYWORD_PATTERN)) {
        // FIXME: remove logging and use a handler
        console.warn('WARNING: terms beginning with "@" are reserved' +
          ' for future use and ignored', {term});
        return;
      } else if(term === '') {
        throw new JsonLdError_1(
          'Invalid JSON-LD syntax; a term cannot be an empty string.',
          'jsonld.SyntaxError',
          {code: 'invalid term definition', context: localCtx});
      }

      // keep reference to previous mapping for potential `@protected` check
      const previousMapping = activeCtx.mappings.get(term);

      // remove old mapping
      if(activeCtx.mappings.has(term)) {
        activeCtx.mappings.delete(term);
      }

      // convert short-hand value to object w/@id
      let simpleTerm = false;
      if(_isString$3(value) || value === null) {
        simpleTerm = true;
        value = {'@id': value};
      }

      if(!_isObject$3(value)) {
        throw new JsonLdError_1(
          'Invalid JSON-LD syntax; @context term values must be ' +
          'strings or objects.',
          'jsonld.SyntaxError',
          {code: 'invalid term definition', context: localCtx});
      }

      // create new mapping
      const mapping = {};
      activeCtx.mappings.set(term, mapping);
      mapping.reverse = false;

      // make sure term definition only has expected keywords
      const validKeys = ['@container', '@id', '@language', '@reverse', '@type'];

      // JSON-LD 1.1 support
      if(api$7.processingMode(activeCtx, 1.1)) {
        validKeys.push(
          '@context', '@direction', '@index', '@nest', '@prefix', '@protected');
      }

      for(const kw in value) {
        if(!validKeys.includes(kw)) {
          throw new JsonLdError_1(
            'Invalid JSON-LD syntax; a term definition must not contain ' + kw,
            'jsonld.SyntaxError',
            {code: 'invalid term definition', context: localCtx});
        }
      }

      // always compute whether term has a colon as an optimization for
      // _compactIri
      const colon = term.indexOf(':');
      mapping._termHasColon = (colon > 0);

      if('@reverse' in value) {
        if('@id' in value) {
          throw new JsonLdError_1(
            'Invalid JSON-LD syntax; a @reverse term definition must not ' +
            'contain @id.', 'jsonld.SyntaxError',
            {code: 'invalid reverse property', context: localCtx});
        }
        if('@nest' in value) {
          throw new JsonLdError_1(
            'Invalid JSON-LD syntax; a @reverse term definition must not ' +
            'contain @nest.', 'jsonld.SyntaxError',
            {code: 'invalid reverse property', context: localCtx});
        }
        const reverse = value['@reverse'];
        if(!_isString$3(reverse)) {
          throw new JsonLdError_1(
            'Invalid JSON-LD syntax; a @context @reverse value must be a string.',
            'jsonld.SyntaxError', {code: 'invalid IRI mapping', context: localCtx});
        }

        if(!api$7.isKeyword(reverse) && reverse.match(KEYWORD_PATTERN)) {
          // FIXME: remove logging and use a handler
          console.warn('WARNING: values beginning with "@" are reserved' +
            ' for future use and ignored', {reverse});
          if(previousMapping) {
            activeCtx.mappings.set(term, previousMapping);
          } else {
            activeCtx.mappings.delete(term);
          }
          return;
        }

        // expand and add @id mapping
        const id = _expandIri$3(
          activeCtx, reverse, {vocab: true, base: false}, localCtx, defined,
          options);
        if(!_isAbsoluteIri$2(id)) {
          throw new JsonLdError_1(
            'Invalid JSON-LD syntax; a @context @reverse value must be an ' +
            'absolute IRI or a blank node identifier.',
            'jsonld.SyntaxError', {code: 'invalid IRI mapping', context: localCtx});
        }

        mapping['@id'] = id;
        mapping.reverse = true;
      } else if('@id' in value) {
        let id = value['@id'];
        if(id && !_isString$3(id)) {
          throw new JsonLdError_1(
            'Invalid JSON-LD syntax; a @context @id value must be an array ' +
            'of strings or a string.',
            'jsonld.SyntaxError', {code: 'invalid IRI mapping', context: localCtx});
        }
        if(id === null) {
          // reserve a null term, which may be protected
          mapping['@id'] = null;
        } else if(!api$7.isKeyword(id) && id.match(KEYWORD_PATTERN)) {
          // FIXME: remove logging and use a handler
          console.warn('WARNING: values beginning with "@" are reserved' +
            ' for future use and ignored', {id});
          if(previousMapping) {
            activeCtx.mappings.set(term, previousMapping);
          } else {
            activeCtx.mappings.delete(term);
          }
          return;
        } else if(id !== term) {
          // expand and add @id mapping
          id = _expandIri$3(
            activeCtx, id, {vocab: true, base: false}, localCtx, defined, options);
          if(!_isAbsoluteIri$2(id) && !api$7.isKeyword(id)) {
            throw new JsonLdError_1(
              'Invalid JSON-LD syntax; a @context @id value must be an ' +
              'absolute IRI, a blank node identifier, or a keyword.',
              'jsonld.SyntaxError',
              {code: 'invalid IRI mapping', context: localCtx});
          }

          // if term has the form of an IRI it must map the same
          if(term.match(/(?::[^:])|\//)) {
            const termDefined = new Map(defined).set(term, true);
            const termIri = _expandIri$3(
              activeCtx, term, {vocab: true, base: false},
              localCtx, termDefined, options);
            if(termIri !== id) {
              throw new JsonLdError_1(
                'Invalid JSON-LD syntax; term in form of IRI must ' +
                'expand to definition.',
                'jsonld.SyntaxError',
                {code: 'invalid IRI mapping', context: localCtx});
            }
          }

          mapping['@id'] = id;
          // indicate if this term may be used as a compact IRI prefix
          mapping._prefix = (simpleTerm &&
            !mapping._termHasColon &&
            id.match(/[:\/\?#\[\]@]$/));
        }
      }

      if(!('@id' in mapping)) {
        // see if the term has a prefix
        if(mapping._termHasColon) {
          const prefix = term.substr(0, colon);
          if(localCtx.hasOwnProperty(prefix)) {
            // define parent prefix
            api$7.createTermDefinition({
              activeCtx, localCtx, term: prefix, defined, options
            });
          }

          if(activeCtx.mappings.has(prefix)) {
            // set @id based on prefix parent
            const suffix = term.substr(colon + 1);
            mapping['@id'] = activeCtx.mappings.get(prefix)['@id'] + suffix;
          } else {
            // term is an absolute IRI
            mapping['@id'] = term;
          }
        } else if(term === '@type') {
          // Special case, were we've previously determined that container is @set
          mapping['@id'] = term;
        } else {
          // non-IRIs *must* define @ids if @vocab is not available
          if(!('@vocab' in activeCtx)) {
            throw new JsonLdError_1(
              'Invalid JSON-LD syntax; @context terms must define an @id.',
              'jsonld.SyntaxError',
              {code: 'invalid IRI mapping', context: localCtx, term});
          }
          // prepend vocab to term
          mapping['@id'] = activeCtx['@vocab'] + term;
        }
      }

      // Handle term protection
      if(value['@protected'] === true ||
        (defined.get('@protected') === true && value['@protected'] !== false)) {
        activeCtx.protected[term] = true;
        mapping.protected = true;
      }

      // IRI mapping now defined
      defined.set(term, true);

      if('@type' in value) {
        let type = value['@type'];
        if(!_isString$3(type)) {
          throw new JsonLdError_1(
            'Invalid JSON-LD syntax; an @context @type value must be a string.',
            'jsonld.SyntaxError',
            {code: 'invalid type mapping', context: localCtx});
        }

        if((type === '@json' || type === '@none')) {
          if(api$7.processingMode(activeCtx, 1.0)) {
            throw new JsonLdError_1(
              'Invalid JSON-LD syntax; an @context @type value must not be ' +
              `"${type}" in JSON-LD 1.0 mode.`,
              'jsonld.SyntaxError',
              {code: 'invalid type mapping', context: localCtx});
          }
        } else if(type !== '@id' && type !== '@vocab') {
          // expand @type to full IRI
          type = _expandIri$3(
            activeCtx, type, {vocab: true, base: false}, localCtx, defined,
            options);
          if(!_isAbsoluteIri$2(type)) {
            throw new JsonLdError_1(
              'Invalid JSON-LD syntax; an @context @type value must be an ' +
              'absolute IRI.',
              'jsonld.SyntaxError',
              {code: 'invalid type mapping', context: localCtx});
          }
          if(type.indexOf('_:') === 0) {
            throw new JsonLdError_1(
              'Invalid JSON-LD syntax; an @context @type value must be an IRI, ' +
              'not a blank node identifier.',
              'jsonld.SyntaxError',
              {code: 'invalid type mapping', context: localCtx});
          }
        }

        // add @type to mapping
        mapping['@type'] = type;
      }

      if('@container' in value) {
        // normalize container to an array form
        const container = _isString$3(value['@container']) ?
          [value['@container']] : (value['@container'] || []);
        const validContainers = ['@list', '@set', '@index', '@language'];
        let isValid = true;
        const hasSet = container.includes('@set');

        // JSON-LD 1.1 support
        if(api$7.processingMode(activeCtx, 1.1)) {
          validContainers.push('@graph', '@id', '@type');

          // check container length
          if(container.includes('@list')) {
            if(container.length !== 1) {
              throw new JsonLdError_1(
                'Invalid JSON-LD syntax; @context @container with @list must ' +
                'have no other values',
                'jsonld.SyntaxError',
                {code: 'invalid container mapping', context: localCtx});
            }
          } else if(container.includes('@graph')) {
            if(container.some(key =>
              key !== '@graph' && key !== '@id' && key !== '@index' &&
              key !== '@set')) {
              throw new JsonLdError_1(
                'Invalid JSON-LD syntax; @context @container with @graph must ' +
                'have no other values other than @id, @index, and @set',
                'jsonld.SyntaxError',
                {code: 'invalid container mapping', context: localCtx});
            }
          } else {
            // otherwise, container may also include @set
            isValid &= container.length <= (hasSet ? 2 : 1);
          }

          if(container.includes('@type')) {
            // If mapping does not have an @type,
            // set it to @id
            mapping['@type'] = mapping['@type'] || '@id';

            // type mapping must be either @id or @vocab
            if(!['@id', '@vocab'].includes(mapping['@type'])) {
              throw new JsonLdError_1(
                'Invalid JSON-LD syntax; container: @type requires @type to be ' +
                '@id or @vocab.',
                'jsonld.SyntaxError',
                {code: 'invalid type mapping', context: localCtx});
            }
          }
        } else {
          // in JSON-LD 1.0, container must not be an array (it must be a string,
          // which is one of the validContainers)
          isValid &= !_isArray$3(value['@container']);

          // check container length
          isValid &= container.length <= 1;
        }

        // check against valid containers
        isValid &= container.every(c => validContainers.includes(c));

        // @set not allowed with @list
        isValid &= !(hasSet && container.includes('@list'));

        if(!isValid) {
          throw new JsonLdError_1(
            'Invalid JSON-LD syntax; @context @container value must be ' +
            'one of the following: ' + validContainers.join(', '),
            'jsonld.SyntaxError',
            {code: 'invalid container mapping', context: localCtx});
        }

        if(mapping.reverse &&
          !container.every(c => ['@index', '@set'].includes(c))) {
          throw new JsonLdError_1(
            'Invalid JSON-LD syntax; @context @container value for a @reverse ' +
            'type definition must be @index or @set.', 'jsonld.SyntaxError',
            {code: 'invalid reverse property', context: localCtx});
        }

        // add @container to mapping
        mapping['@container'] = container;
      }

      // property indexing
      if('@index' in value) {
        if(!('@container' in value) || !mapping['@container'].includes('@index')) {
          throw new JsonLdError_1(
            'Invalid JSON-LD syntax; @index without @index in @container: ' +
            `"${value['@index']}" on term "${term}".`, 'jsonld.SyntaxError',
            {code: 'invalid term definition', context: localCtx});
        }
        if(!_isString$3(value['@index']) || value['@index'].indexOf('@') === 0) {
          throw new JsonLdError_1(
            'Invalid JSON-LD syntax; @index must expand to an IRI: ' +
            `"${value['@index']}" on term "${term}".`, 'jsonld.SyntaxError',
            {code: 'invalid term definition', context: localCtx});
        }
        mapping['@index'] = value['@index'];
      }

      // scoped contexts
      if('@context' in value) {
        mapping['@context'] = value['@context'];
      }

      if('@language' in value && !('@type' in value)) {
        let language = value['@language'];
        if(language !== null && !_isString$3(language)) {
          throw new JsonLdError_1(
            'Invalid JSON-LD syntax; @context @language value must be ' +
            'a string or null.', 'jsonld.SyntaxError',
            {code: 'invalid language mapping', context: localCtx});
        }

        // add @language to mapping
        if(language !== null) {
          language = language.toLowerCase();
        }
        mapping['@language'] = language;
      }

      // term may be used as a prefix
      if('@prefix' in value) {
        if(term.match(/:|\//)) {
          throw new JsonLdError_1(
            'Invalid JSON-LD syntax; @context @prefix used on a compact IRI term',
            'jsonld.SyntaxError',
            {code: 'invalid term definition', context: localCtx});
        }
        if(api$7.isKeyword(mapping['@id'])) {
          throw new JsonLdError_1(
            'Invalid JSON-LD syntax; keywords may not be used as prefixes',
            'jsonld.SyntaxError',
            {code: 'invalid term definition', context: localCtx});
        }
        if(typeof value['@prefix'] === 'boolean') {
          mapping._prefix = value['@prefix'] === true;
        } else {
          throw new JsonLdError_1(
            'Invalid JSON-LD syntax; @context value for @prefix must be boolean',
            'jsonld.SyntaxError',
            {code: 'invalid @prefix value', context: localCtx});
        }
      }

      if('@direction' in value) {
        const direction = value['@direction'];
        if(direction !== null && direction !== 'ltr' && direction !== 'rtl') {
          throw new JsonLdError_1(
            'Invalid JSON-LD syntax; @direction value must be ' +
            'null, "ltr", or "rtl".',
            'jsonld.SyntaxError',
            {code: 'invalid base direction', context: localCtx});
        }
        mapping['@direction'] = direction;
      }

      if('@nest' in value) {
        const nest = value['@nest'];
        if(!_isString$3(nest) || (nest !== '@nest' && nest.indexOf('@') === 0)) {
          throw new JsonLdError_1(
            'Invalid JSON-LD syntax; @context @nest value must be ' +
            'a string which is not a keyword other than @nest.',
            'jsonld.SyntaxError',
            {code: 'invalid @nest value', context: localCtx});
        }
        mapping['@nest'] = nest;
      }

      // disallow aliasing @context and @preserve
      const id = mapping['@id'];
      if(id === '@context' || id === '@preserve') {
        throw new JsonLdError_1(
          'Invalid JSON-LD syntax; @context and @preserve cannot be aliased.',
          'jsonld.SyntaxError', {code: 'invalid keyword alias', context: localCtx});
      }

      // Check for overriding protected terms
      if(previousMapping && previousMapping.protected && !overrideProtected) {
        // force new term to continue to be protected and see if the mappings would
        // be equal
        activeCtx.protected[term] = true;
        mapping.protected = true;
        if(!_deepCompare(previousMapping, mapping)) {
          const protectedMode = (options && options.protectedMode) || 'error';
          if(protectedMode === 'error') {
            throw new JsonLdError_1(
              `Invalid JSON-LD syntax; tried to redefine "${term}" which is a ` +
              'protected term.',
              'jsonld.SyntaxError',
              {code: 'protected term redefinition', context: localCtx, term});
          } else if(protectedMode === 'warn') {
            // FIXME: remove logging and use a handler
            console.warn('WARNING: protected term redefinition', {term});
            return;
          }
          throw new JsonLdError_1(
            'Invalid protectedMode.',
            'jsonld.SyntaxError',
            {code: 'invalid protected mode', context: localCtx, term,
              protectedMode});
        }
      }
    };

    /**
     * Expands a string to a full IRI. The string may be a term, a prefix, a
     * relative IRI, or an absolute IRI. The associated absolute IRI will be
     * returned.
     *
     * @param activeCtx the current active context.
     * @param value the string to expand.
     * @param relativeTo options for how to resolve relative IRIs:
     *          base: true to resolve against the base IRI, false not to.
     *          vocab: true to concatenate after @vocab, false not to.
     * @param {Object} [options] - processing options.
     *
     * @return the expanded value.
     */
    api$7.expandIri = (activeCtx, value, relativeTo, options) => {
      return _expandIri$3(activeCtx, value, relativeTo, undefined, undefined,
        options);
    };

    /**
     * Expands a string to a full IRI. The string may be a term, a prefix, a
     * relative IRI, or an absolute IRI. The associated absolute IRI will be
     * returned.
     *
     * @param activeCtx the current active context.
     * @param value the string to expand.
     * @param relativeTo options for how to resolve relative IRIs:
     *          base: true to resolve against the base IRI, false not to.
     *          vocab: true to concatenate after @vocab, false not to.
     * @param localCtx the local context being processed (only given if called
     *          during context processing).
     * @param defined a map for tracking cycles in context definitions (only given
     *          if called during context processing).
     * @param {Object} [options] - processing options.
     *
     * @return the expanded value.
     */
    function _expandIri$3(activeCtx, value, relativeTo, localCtx, defined, options) {
      // already expanded
      if(value === null || !_isString$3(value) || api$7.isKeyword(value)) {
        return value;
      }

      // ignore non-keyword things that look like a keyword
      if(value.match(KEYWORD_PATTERN)) {
        return null;
      }

      // define term dependency if not defined
      if(localCtx && localCtx.hasOwnProperty(value) &&
        defined.get(value) !== true) {
        api$7.createTermDefinition({
          activeCtx, localCtx, term: value, defined, options
        });
      }

      relativeTo = relativeTo || {};
      if(relativeTo.vocab) {
        const mapping = activeCtx.mappings.get(value);

        // value is explicitly ignored with a null mapping
        if(mapping === null) {
          return null;
        }

        if(_isObject$3(mapping) && '@id' in mapping) {
          // value is a term
          return mapping['@id'];
        }
      }

      // split value into prefix:suffix
      const colon = value.indexOf(':');
      if(colon > 0) {
        const prefix = value.substr(0, colon);
        const suffix = value.substr(colon + 1);

        // do not expand blank nodes (prefix of '_') or already-absolute
        // IRIs (suffix of '//')
        if(prefix === '_' || suffix.indexOf('//') === 0) {
          return value;
        }

        // prefix dependency not defined, define it
        if(localCtx && localCtx.hasOwnProperty(prefix)) {
          api$7.createTermDefinition({
            activeCtx, localCtx, term: prefix, defined, options
          });
        }

        // use mapping if prefix is defined
        const mapping = activeCtx.mappings.get(prefix);
        if(mapping && mapping._prefix) {
          return mapping['@id'] + suffix;
        }

        // already absolute IRI
        if(_isAbsoluteIri$2(value)) {
          return value;
        }
      }

      // prepend vocab
      if(relativeTo.vocab && '@vocab' in activeCtx) {
        return activeCtx['@vocab'] + value;
      }

      // prepend base
      if(relativeTo.base && '@base' in activeCtx) {
        if(activeCtx['@base']) {
          // The null case preserves value as potentially relative
          return prependBase(prependBase(options.base, activeCtx['@base']), value);
        }
      } else if(relativeTo.base) {
        return prependBase(options.base, value);
      }

      return value;
    }

    /**
     * Gets the initial context.
     *
     * @param options the options to use:
     *          [base] the document base IRI.
     *
     * @return the initial context.
     */
    api$7.getInitialContext = options => {
      const key = JSON.stringify({processingMode: options.processingMode});
      const cached = INITIAL_CONTEXT_CACHE.get(key);
      if(cached) {
        return cached;
      }

      const initialContext = {
        processingMode: options.processingMode,
        mappings: new Map(),
        inverse: null,
        getInverse: _createInverseContext,
        clone: _cloneActiveContext,
        revertToPreviousContext: _revertToPreviousContext,
        protected: {}
      };
      // TODO: consider using LRU cache instead
      if(INITIAL_CONTEXT_CACHE.size === INITIAL_CONTEXT_CACHE_MAX_SIZE) {
        // clear whole cache -- assumes scenario where the cache fills means
        // the cache isn't being used very efficiently anyway
        INITIAL_CONTEXT_CACHE.clear();
      }
      INITIAL_CONTEXT_CACHE.set(key, initialContext);
      return initialContext;

      /**
       * Generates an inverse context for use in the compaction algorithm, if
       * not already generated for the given active context.
       *
       * @return the inverse context.
       */
      function _createInverseContext() {
        const activeCtx = this;

        // lazily create inverse
        if(activeCtx.inverse) {
          return activeCtx.inverse;
        }
        const inverse = activeCtx.inverse = {};

        // variables for building fast CURIE map
        const fastCurieMap = activeCtx.fastCurieMap = {};
        const irisToTerms = {};

        // handle default language
        const defaultLanguage = (activeCtx['@language'] || '@none').toLowerCase();

        // handle default direction
        const defaultDirection = activeCtx['@direction'];

        // create term selections for each mapping in the context, ordered by
        // shortest and then lexicographically least
        const mappings = activeCtx.mappings;
        const terms = [...mappings.keys()].sort(_compareShortestLeast$1);
        for(const term of terms) {
          const mapping = mappings.get(term);
          if(mapping === null) {
            continue;
          }

          let container = mapping['@container'] || '@none';
          container = [].concat(container).sort().join('');

          if(mapping['@id'] === null) {
            continue;
          }
          // iterate over every IRI in the mapping
          const ids = _asArray$2(mapping['@id']);
          for(const iri of ids) {
            let entry = inverse[iri];
            const isKeyword = api$7.isKeyword(iri);

            if(!entry) {
              // initialize entry
              inverse[iri] = entry = {};

              if(!isKeyword && !mapping._termHasColon) {
                // init IRI to term map and fast CURIE prefixes
                irisToTerms[iri] = [term];
                const fastCurieEntry = {iri, terms: irisToTerms[iri]};
                if(iri[0] in fastCurieMap) {
                  fastCurieMap[iri[0]].push(fastCurieEntry);
                } else {
                  fastCurieMap[iri[0]] = [fastCurieEntry];
                }
              }
            } else if(!isKeyword && !mapping._termHasColon) {
              // add IRI to term match
              irisToTerms[iri].push(term);
            }

            // add new entry
            if(!entry[container]) {
              entry[container] = {
                '@language': {},
                '@type': {},
                '@any': {}
              };
            }
            entry = entry[container];
            _addPreferredTerm(term, entry['@any'], '@none');

            if(mapping.reverse) {
              // term is preferred for values using @reverse
              _addPreferredTerm(term, entry['@type'], '@reverse');
            } else if(mapping['@type'] === '@none') {
              _addPreferredTerm(term, entry['@any'], '@none');
              _addPreferredTerm(term, entry['@language'], '@none');
              _addPreferredTerm(term, entry['@type'], '@none');
            } else if('@type' in mapping) {
              // term is preferred for values using specific type
              _addPreferredTerm(term, entry['@type'], mapping['@type']);
            } else if('@language' in mapping && '@direction' in mapping) {
              // term is preferred for values using specific language and direction
              const language = mapping['@language'];
              const direction = mapping['@direction'];
              if(language && direction) {
                _addPreferredTerm(term, entry['@language'],
                  `${language}_${direction}`.toLowerCase());
              } else if(language) {
                _addPreferredTerm(term, entry['@language'], language.toLowerCase());
              } else if(direction) {
                _addPreferredTerm(term, entry['@language'], `_${direction}`);
              } else {
                _addPreferredTerm(term, entry['@language'], '@null');
              }
            } else if('@language' in mapping) {
              _addPreferredTerm(term, entry['@language'],
                (mapping['@language'] || '@null').toLowerCase());
            } else if('@direction' in mapping) {
              if(mapping['@direction']) {
                _addPreferredTerm(term, entry['@language'],
                  `_${mapping['@direction']}`);
              } else {
                _addPreferredTerm(term, entry['@language'], '@none');
              }
            } else if(defaultDirection) {
              _addPreferredTerm(term, entry['@language'], `_${defaultDirection}`);
              _addPreferredTerm(term, entry['@language'], '@none');
              _addPreferredTerm(term, entry['@type'], '@none');
            } else {
              // add entries for no type and no language
              _addPreferredTerm(term, entry['@language'], defaultLanguage);
              _addPreferredTerm(term, entry['@language'], '@none');
              _addPreferredTerm(term, entry['@type'], '@none');
            }
          }
        }

        // build fast CURIE map
        for(const key in fastCurieMap) {
          _buildIriMap(fastCurieMap, key, 1);
        }

        return inverse;
      }

      /**
       * Runs a recursive algorithm to build a lookup map for quickly finding
       * potential CURIEs.
       *
       * @param iriMap the map to build.
       * @param key the current key in the map to work on.
       * @param idx the index into the IRI to compare.
       */
      function _buildIriMap(iriMap, key, idx) {
        const entries = iriMap[key];
        const next = iriMap[key] = {};

        let iri;
        let letter;
        for(const entry of entries) {
          iri = entry.iri;
          if(idx >= iri.length) {
            letter = '';
          } else {
            letter = iri[idx];
          }
          if(letter in next) {
            next[letter].push(entry);
          } else {
            next[letter] = [entry];
          }
        }

        for(const key in next) {
          if(key === '') {
            continue;
          }
          _buildIriMap(next, key, idx + 1);
        }
      }

      /**
       * Adds the term for the given entry if not already added.
       *
       * @param term the term to add.
       * @param entry the inverse context typeOrLanguage entry to add to.
       * @param typeOrLanguageValue the key in the entry to add to.
       */
      function _addPreferredTerm(term, entry, typeOrLanguageValue) {
        if(!entry.hasOwnProperty(typeOrLanguageValue)) {
          entry[typeOrLanguageValue] = term;
        }
      }

      /**
       * Clones an active context, creating a child active context.
       *
       * @return a clone (child) of the active context.
       */
      function _cloneActiveContext() {
        const child = {};
        child.mappings = util.clone(this.mappings);
        child.clone = this.clone;
        child.inverse = null;
        child.getInverse = this.getInverse;
        child.protected = util.clone(this.protected);
        if(this.previousContext) {
          child.previousContext = this.previousContext.clone();
        }
        child.revertToPreviousContext = this.revertToPreviousContext;
        if('@base' in this) {
          child['@base'] = this['@base'];
        }
        if('@language' in this) {
          child['@language'] = this['@language'];
        }
        if('@vocab' in this) {
          child['@vocab'] = this['@vocab'];
        }
        return child;
      }

      /**
       * Reverts any type-scoped context in this active context to the previous
       * context.
       */
      function _revertToPreviousContext() {
        if(!this.previousContext) {
          return this;
        }
        return this.previousContext.clone();
      }
    };

    /**
     * Gets the value for the given active context key and type, null if none is
     * set or undefined if none is set and type is '@context'.
     *
     * @param ctx the active context.
     * @param key the context key.
     * @param [type] the type of value to get (eg: '@id', '@type'), if not
     *          specified gets the entire entry for a key, null if not found.
     *
     * @return the value, null, or undefined.
     */
    api$7.getContextValue = (ctx, key, type) => {
      // invalid key
      if(key === null) {
        if(type === '@context') {
          return undefined;
        }
        return null;
      }

      // get specific entry information
      if(ctx.mappings.has(key)) {
        const entry = ctx.mappings.get(key);

        if(_isUndefined$2(type)) {
          // return whole entry
          return entry;
        }
        if(entry.hasOwnProperty(type)) {
          // return entry value for type
          return entry[type];
        }
      }

      // get default language
      if(type === '@language' && type in ctx) {
        return ctx[type];
      }

      // get default direction
      if(type === '@direction' && type in ctx) {
        return ctx[type];
      }

      if(type === '@context') {
        return undefined;
      }
      return null;
    };

    /**
     * Processing Mode check.
     *
     * @param activeCtx the current active context.
     * @param version the string or numeric version to check.
     *
     * @return boolean.
     */
    api$7.processingMode = (activeCtx, version) => {
      if(version.toString() >= '1.1') {
        return !activeCtx.processingMode ||
          activeCtx.processingMode >= 'json-ld-' + version.toString();
      } else {
        return activeCtx.processingMode === 'json-ld-1.0';
      }
    };

    /**
     * Returns whether or not the given value is a keyword.
     *
     * @param v the value to check.
     *
     * @return true if the value is a keyword, false if not.
     */
    api$7.isKeyword = v => {
      if(!_isString$3(v) || v[0] !== '@') {
        return false;
      }
      switch(v) {
        case '@base':
        case '@container':
        case '@context':
        case '@default':
        case '@direction':
        case '@embed':
        case '@explicit':
        case '@graph':
        case '@id':
        case '@included':
        case '@index':
        case '@json':
        case '@language':
        case '@list':
        case '@nest':
        case '@none':
        case '@omitDefault':
        case '@prefix':
        case '@preserve':
        case '@protected':
        case '@requireAll':
        case '@reverse':
        case '@set':
        case '@type':
        case '@value':
        case '@version':
        case '@vocab':
          return true;
      }
      return false;
    };

    function _deepCompare(x1, x2) {
      // compare `null` or primitive types directly
      if((!(x1 && typeof x1 === 'object')) ||
         (!(x2 && typeof x2 === 'object'))) {
        return x1 === x2;
      }
      // x1 and x2 are objects (also potentially arrays)
      const x1Array = Array.isArray(x1);
      if(x1Array !== Array.isArray(x2)) {
        return false;
      }
      if(x1Array) {
        if(x1.length !== x2.length) {
          return false;
        }
        for(let i = 0; i < x1.length; ++i) {
          if(!_deepCompare(x1[i], x2[i])) {
            return false;
          }
        }
        return true;
      }
      // x1 and x2 are non-array objects
      const k1s = Object.keys(x1);
      const k2s = Object.keys(x2);
      if(k1s.length !== k2s.length) {
        return false;
      }
      for(const k1 in x1) {
        let v1 = x1[k1];
        let v2 = x2[k1];
        // special case: `@container` can be in any order
        if(k1 === '@container') {
          if(Array.isArray(v1) && Array.isArray(v2)) {
            v1 = v1.slice().sort();
            v2 = v2.slice().sort();
          }
        }
        if(!_deepCompare(v1, v2)) {
          return false;
        }
      }
      return true;
    }

    /*
     * Copyright (c) 2017 Digital Bazaar, Inc. All rights reserved.
     */



    const {
      isArray: _isArray$2,
      isObject: _isObject$2,
      isEmptyObject: _isEmptyObject,
      isString: _isString$2,
      isUndefined: _isUndefined$1
    } = types;

    const {
      isList: _isList$1,
      isValue: _isValue$1,
      isGraph: _isGraph$1,
      isSubject: _isSubject
    } = graphTypes;

    const {
      expandIri: _expandIri$2,
      getContextValue: _getContextValue$1,
      isKeyword: _isKeyword$1,
      process: _processContext$2,
      processingMode: _processingMode$2
    } = context;

    const {
      isAbsolute: _isAbsoluteIri$1
    } = url;

    const {
      addValue: _addValue$1,
      asArray: _asArray$1,
      getValues: _getValues,
      validateTypeValue: _validateTypeValue
    } = util;

    const api$6 = {};
    var expand$1 = api$6;
    const REGEX_BCP47$1 = /^[a-zA-Z]{1,8}(-[a-zA-Z0-9]{1,8})*$/;

    /**
     * Recursively expands an element using the given context. Any context in
     * the element will be removed. All context URLs must have been retrieved
     * before calling this method.
     *
     * @param activeCtx the context to use.
     * @param activeProperty the property for the element, null for none.
     * @param element the element to expand.
     * @param options the expansion options.
     * @param insideList true if the element is a list, false if not.
     * @param insideIndex true if the element is inside an index container,
     *          false if not.
     * @param typeScopedContext an optional type-scoped active context for
     *          expanding values of nodes that were expressed according to
     *          a type-scoped context.
     * @param expansionMap(info) a function that can be used to custom map
     *          unmappable values (or to throw an error when they are detected);
     *          if this function returns `undefined` then the default behavior
     *          will be used.
     *
     * @return a Promise that resolves to the expanded value.
     */
    api$6.expand = async ({
      activeCtx,
      activeProperty = null,
      element,
      options = {},
      insideList = false,
      insideIndex = false,
      typeScopedContext = null,
      expansionMap = () => undefined
    }) => {
      // nothing to expand
      if(element === null || element === undefined) {
        return null;
      }

      // disable framing if activeProperty is @default
      if(activeProperty === '@default') {
        options = Object.assign({}, options, {isFrame: false});
      }

      if(!_isArray$2(element) && !_isObject$2(element)) {
        // drop free-floating scalars that are not in lists unless custom mapped
        if(!insideList && (activeProperty === null ||
          _expandIri$2(activeCtx, activeProperty, {vocab: true},
            options) === '@graph')) {
          const mapped = await expansionMap({
            unmappedValue: element,
            activeCtx,
            activeProperty,
            options,
            insideList
          });
          if(mapped === undefined) {
            return null;
          }
          return mapped;
        }

        // expand element according to value expansion rules
        return _expandValue({activeCtx, activeProperty, value: element, options});
      }

      // recursively expand array
      if(_isArray$2(element)) {
        let rval = [];
        const container = _getContextValue$1(
          activeCtx, activeProperty, '@container') || [];
        insideList = insideList || container.includes('@list');
        for(let i = 0; i < element.length; ++i) {
          // expand element
          let e = await api$6.expand({
            activeCtx,
            activeProperty,
            element: element[i],
            options,
            expansionMap,
            insideIndex,
            typeScopedContext
          });
          if(insideList && _isArray$2(e)) {
            e = {'@list': e};
          }

          if(e === null) {
            e = await expansionMap({
              unmappedValue: element[i],
              activeCtx,
              activeProperty,
              parent: element,
              index: i,
              options,
              expandedParent: rval,
              insideList
            });
            if(e === undefined) {
              continue;
            }
          }

          if(_isArray$2(e)) {
            rval = rval.concat(e);
          } else {
            rval.push(e);
          }
        }
        return rval;
      }

      // recursively expand object:

      // first, expand the active property
      const expandedActiveProperty = _expandIri$2(
        activeCtx, activeProperty, {vocab: true}, options);

      // Get any property-scoped context for activeProperty
      const propertyScopedCtx =
        _getContextValue$1(activeCtx, activeProperty, '@context');

      // second, determine if any type-scoped context should be reverted; it
      // should only be reverted when the following are all true:
      // 1. `element` is not a value or subject reference
      // 2. `insideIndex` is false
      typeScopedContext = typeScopedContext ||
        (activeCtx.previousContext ? activeCtx : null);
      let keys = Object.keys(element).sort();
      let mustRevert = !insideIndex;
      if(mustRevert && typeScopedContext && keys.length <= 2 &&
        !keys.includes('@context')) {
        for(const key of keys) {
          const expandedProperty = _expandIri$2(
            typeScopedContext, key, {vocab: true}, options);
          if(expandedProperty === '@value') {
            // value found, ensure type-scoped context is used to expand it
            mustRevert = false;
            activeCtx = typeScopedContext;
            break;
          }
          if(expandedProperty === '@id' && keys.length === 1) {
            // subject reference found, do not revert
            mustRevert = false;
            break;
          }
        }
      }

      if(mustRevert) {
        // revert type scoped context
        activeCtx = activeCtx.revertToPreviousContext();
      }

      // apply property-scoped context after reverting term-scoped context
      if(!_isUndefined$1(propertyScopedCtx)) {
        activeCtx = await _processContext$2({
          activeCtx,
          localCtx: propertyScopedCtx,
          propagate: true,
          overrideProtected: true,
          options
        });
      }

      // if element has a context, process it
      if('@context' in element) {
        activeCtx = await _processContext$2(
          {activeCtx, localCtx: element['@context'], options});
      }

      // set the type-scoped context to the context on input, for use later
      typeScopedContext = activeCtx;

      // Remember the first key found expanding to @type
      let typeKey = null;

      // look for scoped contexts on `@type`
      for(const key of keys) {
        const expandedProperty = _expandIri$2(activeCtx, key, {vocab: true}, options);
        if(expandedProperty === '@type') {
          // set scoped contexts from @type
          // avoid sorting if possible
          typeKey = typeKey || key;
          const value = element[key];
          const types =
            Array.isArray(value) ?
              (value.length > 1 ? value.slice().sort() : value) : [value];
          for(const type of types) {
            const ctx = _getContextValue$1(typeScopedContext, type, '@context');
            if(!_isUndefined$1(ctx)) {
              activeCtx = await _processContext$2({
                activeCtx,
                localCtx: ctx,
                options,
                propagate: false
              });
            }
          }
        }
      }

      // process each key and value in element, ignoring @nest content
      let rval = {};
      await _expandObject({
        activeCtx,
        activeProperty,
        expandedActiveProperty,
        element,
        expandedParent: rval,
        options,
        insideList,
        typeKey,
        typeScopedContext,
        expansionMap});

      // get property count on expanded output
      keys = Object.keys(rval);
      let count = keys.length;

      if('@value' in rval) {
        // @value must only have @language or @type
        if('@type' in rval && ('@language' in rval || '@direction' in rval)) {
          throw new JsonLdError_1(
            'Invalid JSON-LD syntax; an element containing "@value" may not ' +
            'contain both "@type" and either "@language" or "@direction".',
            'jsonld.SyntaxError', {code: 'invalid value object', element: rval});
        }
        let validCount = count - 1;
        if('@type' in rval) {
          validCount -= 1;
        }
        if('@index' in rval) {
          validCount -= 1;
        }
        if('@language' in rval) {
          validCount -= 1;
        }
        if('@direction' in rval) {
          validCount -= 1;
        }
        if(validCount !== 0) {
          throw new JsonLdError_1(
            'Invalid JSON-LD syntax; an element containing "@value" may only ' +
            'have an "@index" property and either "@type" ' +
            'or either or both "@language" or "@direction".',
            'jsonld.SyntaxError', {code: 'invalid value object', element: rval});
        }
        const values = rval['@value'] === null ? [] : _asArray$1(rval['@value']);
        const types = _getValues(rval, '@type');

        // drop null @values unless custom mapped
        if(_processingMode$2(activeCtx, 1.1) && types.includes('@json') &&
          types.length === 1) ; else if(values.length === 0) {
          const mapped = await expansionMap({
            unmappedValue: rval,
            activeCtx,
            activeProperty,
            element,
            options,
            insideList
          });
          if(mapped !== undefined) {
            rval = mapped;
          } else {
            rval = null;
          }
        } else if(!values.every(v => (_isString$2(v) || _isEmptyObject(v))) &&
          '@language' in rval) {
          // if @language is present, @value must be a string
          throw new JsonLdError_1(
            'Invalid JSON-LD syntax; only strings may be language-tagged.',
            'jsonld.SyntaxError',
            {code: 'invalid language-tagged value', element: rval});
        } else if(!types.every(t =>
          (_isAbsoluteIri$1(t) && !(_isString$2(t) && t.indexOf('_:') === 0) ||
          _isEmptyObject(t)))) {
          throw new JsonLdError_1(
            'Invalid JSON-LD syntax; an element containing "@value" and "@type" ' +
            'must have an absolute IRI for the value of "@type".',
            'jsonld.SyntaxError', {code: 'invalid typed value', element: rval});
        }
      } else if('@type' in rval && !_isArray$2(rval['@type'])) {
        // convert @type to an array
        rval['@type'] = [rval['@type']];
      } else if('@set' in rval || '@list' in rval) {
        // handle @set and @list
        if(count > 1 && !(count === 2 && '@index' in rval)) {
          throw new JsonLdError_1(
            'Invalid JSON-LD syntax; if an element has the property "@set" ' +
            'or "@list", then it can have at most one other property that is ' +
            '"@index".', 'jsonld.SyntaxError',
            {code: 'invalid set or list object', element: rval});
        }
        // optimize away @set
        if('@set' in rval) {
          rval = rval['@set'];
          keys = Object.keys(rval);
          count = keys.length;
        }
      } else if(count === 1 && '@language' in rval) {
        // drop objects with only @language unless custom mapped
        const mapped = await expansionMap(rval, {
          unmappedValue: rval,
          activeCtx,
          activeProperty,
          element,
          options,
          insideList
        });
        if(mapped !== undefined) {
          rval = mapped;
        } else {
          rval = null;
        }
      }

      // drop certain top-level objects that do not occur in lists, unless custom
      // mapped
      if(_isObject$2(rval) &&
        !options.keepFreeFloatingNodes && !insideList &&
        (activeProperty === null || expandedActiveProperty === '@graph')) {
        // drop empty object, top-level @value/@list, or object with only @id
        if(count === 0 || '@value' in rval || '@list' in rval ||
          (count === 1 && '@id' in rval)) {
          const mapped = await expansionMap({
            unmappedValue: rval,
            activeCtx,
            activeProperty,
            element,
            options,
            insideList
          });
          if(mapped !== undefined) {
            rval = mapped;
          } else {
            rval = null;
          }
        }
      }

      return rval;
    };

    /**
     * Expand each key and value of element adding to result
     *
     * @param activeCtx the context to use.
     * @param activeProperty the property for the element.
     * @param expandedActiveProperty the expansion of activeProperty
     * @param element the element to expand.
     * @param expandedParent the expanded result into which to add values.
     * @param options the expansion options.
     * @param insideList true if the element is a list, false if not.
     * @param typeKey first key found expanding to @type.
     * @param typeScopedContext the context before reverting.
     * @param expansionMap(info) a function that can be used to custom map
     *          unmappable values (or to throw an error when they are detected);
     *          if this function returns `undefined` then the default behavior
     *          will be used.
     */
    async function _expandObject({
      activeCtx,
      activeProperty,
      expandedActiveProperty,
      element,
      expandedParent,
      options = {},
      insideList,
      typeKey,
      typeScopedContext,
      expansionMap
    }) {
      const keys = Object.keys(element).sort();
      const nests = [];
      let unexpandedValue;

      // Figure out if this is the type for a JSON literal
      const isJsonType = element[typeKey] &&
        _expandIri$2(activeCtx,
          (_isArray$2(element[typeKey]) ? element[typeKey][0] : element[typeKey]),
          {vocab: true}, options) === '@json';

      for(const key of keys) {
        let value = element[key];
        let expandedValue;

        // skip @context
        if(key === '@context') {
          continue;
        }

        // expand property
        let expandedProperty = _expandIri$2(activeCtx, key, {vocab: true}, options);

        // drop non-absolute IRI keys that aren't keywords unless custom mapped
        if(expandedProperty === null ||
          !(_isAbsoluteIri$1(expandedProperty) || _isKeyword$1(expandedProperty))) {
          // TODO: use `await` to support async
          expandedProperty = expansionMap({
            unmappedProperty: key,
            activeCtx,
            activeProperty,
            parent: element,
            options,
            insideList,
            value,
            expandedParent
          });
          if(expandedProperty === undefined) {
            continue;
          }
        }

        if(_isKeyword$1(expandedProperty)) {
          if(expandedActiveProperty === '@reverse') {
            throw new JsonLdError_1(
              'Invalid JSON-LD syntax; a keyword cannot be used as a @reverse ' +
              'property.', 'jsonld.SyntaxError',
              {code: 'invalid reverse property map', value});
          }
          if(expandedProperty in expandedParent &&
             expandedProperty !== '@included' &&
             expandedProperty !== '@type') {
            throw new JsonLdError_1(
              'Invalid JSON-LD syntax; colliding keywords detected.',
              'jsonld.SyntaxError',
              {code: 'colliding keywords', keyword: expandedProperty});
          }
        }

        // syntax error if @id is not a string
        if(expandedProperty === '@id') {
          if(!_isString$2(value)) {
            if(!options.isFrame) {
              throw new JsonLdError_1(
                'Invalid JSON-LD syntax; "@id" value must a string.',
                'jsonld.SyntaxError', {code: 'invalid @id value', value});
            }
            if(_isObject$2(value)) {
              // empty object is a wildcard
              if(!_isEmptyObject(value)) {
                throw new JsonLdError_1(
                  'Invalid JSON-LD syntax; "@id" value an empty object or array ' +
                  'of strings, if framing',
                  'jsonld.SyntaxError', {code: 'invalid @id value', value});
              }
            } else if(_isArray$2(value)) {
              if(!value.every(v => _isString$2(v))) {
                throw new JsonLdError_1(
                  'Invalid JSON-LD syntax; "@id" value an empty object or array ' +
                  'of strings, if framing',
                  'jsonld.SyntaxError', {code: 'invalid @id value', value});
              }
            } else {
              throw new JsonLdError_1(
                'Invalid JSON-LD syntax; "@id" value an empty object or array ' +
                'of strings, if framing',
                'jsonld.SyntaxError', {code: 'invalid @id value', value});
            }
          }

          _addValue$1(
            expandedParent, '@id',
            _asArray$1(value).map(v =>
              _isString$2(v) ? _expandIri$2(activeCtx, v, {base: true}, options) : v),
            {propertyIsArray: options.isFrame});
          continue;
        }

        if(expandedProperty === '@type') {
          // if framing, can be a default object, but need to expand
          // key to determine that
          if(_isObject$2(value)) {
            value = Object.fromEntries(Object.entries(value).map(([k, v]) => [
              _expandIri$2(typeScopedContext, k, {vocab: true}),
              _asArray$1(v).map(vv =>
                _expandIri$2(typeScopedContext, vv, {base: true, vocab: true})
              )
            ]));
          }
          _validateTypeValue(value, options.isFrame);
          _addValue$1(
            expandedParent, '@type',
            _asArray$1(value).map(v =>
              _isString$2(v) ?
                _expandIri$2(typeScopedContext, v,
                  {base: true, vocab: true}, options) : v),
            {propertyIsArray: options.isFrame});
          continue;
        }

        // Included blocks are treated as an array of separate object nodes sharing
        // the same referencing active_property.
        // For 1.0, it is skipped as are other unknown keywords
        if(expandedProperty === '@included' && _processingMode$2(activeCtx, 1.1)) {
          const includedResult = _asArray$1(await api$6.expand({
            activeCtx,
            activeProperty,
            element: value,
            options,
            expansionMap
          }));

          // Expanded values must be node objects
          if(!includedResult.every(v => _isSubject(v))) {
            throw new JsonLdError_1(
              'Invalid JSON-LD syntax; ' +
              'values of @included must expand to node objects.',
              'jsonld.SyntaxError', {code: 'invalid @included value', value});
          }

          _addValue$1(
            expandedParent, '@included', includedResult, {propertyIsArray: true});
          continue;
        }

        // @graph must be an array or an object
        if(expandedProperty === '@graph' &&
          !(_isObject$2(value) || _isArray$2(value))) {
          throw new JsonLdError_1(
            'Invalid JSON-LD syntax; "@graph" value must not be an ' +
            'object or an array.',
            'jsonld.SyntaxError', {code: 'invalid @graph value', value});
        }

        if(expandedProperty === '@value') {
          // capture value for later
          // "colliding keywords" check prevents this from being set twice
          unexpandedValue = value;
          if(isJsonType && _processingMode$2(activeCtx, 1.1)) {
            // no coercion to array, and retain all values
            expandedParent['@value'] = value;
          } else {
            _addValue$1(
              expandedParent, '@value', value, {propertyIsArray: options.isFrame});
          }
          continue;
        }

        // @language must be a string
        // it should match BCP47
        if(expandedProperty === '@language') {
          if(value === null) {
            // drop null @language values, they expand as if they didn't exist
            continue;
          }
          if(!_isString$2(value) && !options.isFrame) {
            throw new JsonLdError_1(
              'Invalid JSON-LD syntax; "@language" value must be a string.',
              'jsonld.SyntaxError',
              {code: 'invalid language-tagged string', value});
          }
          // ensure language value is lowercase
          value = _asArray$1(value).map(v => _isString$2(v) ? v.toLowerCase() : v);

          // ensure language tag matches BCP47
          for(const lang of value) {
            if(_isString$2(lang) && !lang.match(REGEX_BCP47$1)) {
              console.warn(`@language must be valid BCP47: ${lang}`);
            }
          }

          _addValue$1(
            expandedParent, '@language', value, {propertyIsArray: options.isFrame});
          continue;
        }

        // @direction must be "ltr" or "rtl"
        if(expandedProperty === '@direction') {
          if(!_isString$2(value) && !options.isFrame) {
            throw new JsonLdError_1(
              'Invalid JSON-LD syntax; "@direction" value must be a string.',
              'jsonld.SyntaxError',
              {code: 'invalid base direction', value});
          }

          value = _asArray$1(value);

          // ensure direction is "ltr" or "rtl"
          for(const dir of value) {
            if(_isString$2(dir) && dir !== 'ltr' && dir !== 'rtl') {
              throw new JsonLdError_1(
                'Invalid JSON-LD syntax; "@direction" must be "ltr" or "rtl".',
                'jsonld.SyntaxError',
                {code: 'invalid base direction', value});
            }
          }

          _addValue$1(
            expandedParent, '@direction', value,
            {propertyIsArray: options.isFrame});
          continue;
        }

        // @index must be a string
        if(expandedProperty === '@index') {
          if(!_isString$2(value)) {
            throw new JsonLdError_1(
              'Invalid JSON-LD syntax; "@index" value must be a string.',
              'jsonld.SyntaxError',
              {code: 'invalid @index value', value});
          }
          _addValue$1(expandedParent, '@index', value);
          continue;
        }

        // @reverse must be an object
        if(expandedProperty === '@reverse') {
          if(!_isObject$2(value)) {
            throw new JsonLdError_1(
              'Invalid JSON-LD syntax; "@reverse" value must be an object.',
              'jsonld.SyntaxError', {code: 'invalid @reverse value', value});
          }

          expandedValue = await api$6.expand({
            activeCtx,
            activeProperty:
            '@reverse',
            element: value,
            options,
            expansionMap
          });
          // properties double-reversed
          if('@reverse' in expandedValue) {
            for(const property in expandedValue['@reverse']) {
              _addValue$1(
                expandedParent, property, expandedValue['@reverse'][property],
                {propertyIsArray: true});
            }
          }

          // FIXME: can this be merged with code below to simplify?
          // merge in all reversed properties
          let reverseMap = expandedParent['@reverse'] || null;
          for(const property in expandedValue) {
            if(property === '@reverse') {
              continue;
            }
            if(reverseMap === null) {
              reverseMap = expandedParent['@reverse'] = {};
            }
            _addValue$1(reverseMap, property, [], {propertyIsArray: true});
            const items = expandedValue[property];
            for(let ii = 0; ii < items.length; ++ii) {
              const item = items[ii];
              if(_isValue$1(item) || _isList$1(item)) {
                throw new JsonLdError_1(
                  'Invalid JSON-LD syntax; "@reverse" value must not be a ' +
                  '@value or an @list.', 'jsonld.SyntaxError',
                  {code: 'invalid reverse property value', value: expandedValue});
              }
              _addValue$1(reverseMap, property, item, {propertyIsArray: true});
            }
          }

          continue;
        }

        // nested keys
        if(expandedProperty === '@nest') {
          nests.push(key);
          continue;
        }

        // use potential scoped context for key
        let termCtx = activeCtx;
        const ctx = _getContextValue$1(activeCtx, key, '@context');
        if(!_isUndefined$1(ctx)) {
          termCtx = await _processContext$2({
            activeCtx,
            localCtx: ctx,
            propagate: true,
            overrideProtected: true,
            options
          });
        }

        const container = _getContextValue$1(termCtx, key, '@container') || [];

        if(container.includes('@language') && _isObject$2(value)) {
          const direction = _getContextValue$1(termCtx, key, '@direction');
          // handle language map container (skip if value is not an object)
          expandedValue = _expandLanguageMap(termCtx, value, direction, options);
        } else if(container.includes('@index') && _isObject$2(value)) {
          // handle index container (skip if value is not an object)
          const asGraph = container.includes('@graph');
          const indexKey = _getContextValue$1(termCtx, key, '@index') || '@index';
          const propertyIndex = indexKey !== '@index' &&
            _expandIri$2(activeCtx, indexKey, {vocab: true}, options);

          expandedValue = await _expandIndexMap({
            activeCtx: termCtx,
            options,
            activeProperty: key,
            value,
            expansionMap,
            asGraph,
            indexKey,
            propertyIndex
          });
        } else if(container.includes('@id') && _isObject$2(value)) {
          // handle id container (skip if value is not an object)
          const asGraph = container.includes('@graph');
          expandedValue = await _expandIndexMap({
            activeCtx: termCtx,
            options,
            activeProperty: key,
            value,
            expansionMap,
            asGraph,
            indexKey: '@id'
          });
        } else if(container.includes('@type') && _isObject$2(value)) {
          // handle type container (skip if value is not an object)
          expandedValue = await _expandIndexMap({
            // since container is `@type`, revert type scoped context when expanding
            activeCtx: termCtx.revertToPreviousContext(),
            options,
            activeProperty: key,
            value,
            expansionMap,
            asGraph: false,
            indexKey: '@type'
          });
        } else {
          // recurse into @list or @set
          const isList = (expandedProperty === '@list');
          if(isList || expandedProperty === '@set') {
            let nextActiveProperty = activeProperty;
            if(isList && expandedActiveProperty === '@graph') {
              nextActiveProperty = null;
            }
            expandedValue = await api$6.expand({
              activeCtx: termCtx,
              activeProperty: nextActiveProperty,
              element: value,
              options,
              insideList: isList,
              expansionMap
            });
          } else if(
            _getContextValue$1(activeCtx, key, '@type') === '@json') {
            expandedValue = {
              '@type': '@json',
              '@value': value
            };
          } else {
            // recursively expand value with key as new active property
            expandedValue = await api$6.expand({
              activeCtx: termCtx,
              activeProperty: key,
              element: value,
              options,
              insideList: false,
              expansionMap
            });
          }
        }

        // drop null values if property is not @value
        if(expandedValue === null && expandedProperty !== '@value') {
          // TODO: use `await` to support async
          expandedValue = expansionMap({
            unmappedValue: value,
            expandedProperty,
            activeCtx: termCtx,
            activeProperty,
            parent: element,
            options,
            insideList,
            key,
            expandedParent
          });
          if(expandedValue === undefined) {
            continue;
          }
        }

        // convert expanded value to @list if container specifies it
        if(expandedProperty !== '@list' && !_isList$1(expandedValue) &&
          container.includes('@list')) {
          // ensure expanded value in @list is an array
          expandedValue = {'@list': _asArray$1(expandedValue)};
        }

        // convert expanded value to @graph if container specifies it
        // and value is not, itself, a graph
        // index cases handled above
        if(container.includes('@graph') &&
          !container.some(key => key === '@id' || key === '@index')) {
          // ensure expanded values are arrays
          expandedValue = _asArray$1(expandedValue)
            .map(v => ({'@graph': _asArray$1(v)}));
        }

        // FIXME: can this be merged with code above to simplify?
        // merge in reverse properties
        if(termCtx.mappings.has(key) && termCtx.mappings.get(key).reverse) {
          const reverseMap =
            expandedParent['@reverse'] = expandedParent['@reverse'] || {};
          expandedValue = _asArray$1(expandedValue);
          for(let ii = 0; ii < expandedValue.length; ++ii) {
            const item = expandedValue[ii];
            if(_isValue$1(item) || _isList$1(item)) {
              throw new JsonLdError_1(
                'Invalid JSON-LD syntax; "@reverse" value must not be a ' +
                '@value or an @list.', 'jsonld.SyntaxError',
                {code: 'invalid reverse property value', value: expandedValue});
            }
            _addValue$1(reverseMap, expandedProperty, item, {propertyIsArray: true});
          }
          continue;
        }

        // add value for property
        // special keywords handled above
        _addValue$1(expandedParent, expandedProperty, expandedValue, {
          propertyIsArray: true
        });
      }

      // @value must not be an object or an array (unless framing) or if @type is
      // @json
      if('@value' in expandedParent) {
        if(expandedParent['@type'] === '@json' && _processingMode$2(activeCtx, 1.1)) ; else if((_isObject$2(unexpandedValue) || _isArray$2(unexpandedValue)) &&
          !options.isFrame) {
          throw new JsonLdError_1(
            'Invalid JSON-LD syntax; "@value" value must not be an ' +
            'object or an array.',
            'jsonld.SyntaxError',
            {code: 'invalid value object value', value: unexpandedValue});
        }
      }

      // expand each nested key
      for(const key of nests) {
        const nestedValues = _isArray$2(element[key]) ? element[key] : [element[key]];
        for(const nv of nestedValues) {
          if(!_isObject$2(nv) || Object.keys(nv).some(k =>
            _expandIri$2(activeCtx, k, {vocab: true}, options) === '@value')) {
            throw new JsonLdError_1(
              'Invalid JSON-LD syntax; nested value must be a node object.',
              'jsonld.SyntaxError',
              {code: 'invalid @nest value', value: nv});
          }
          await _expandObject({
            activeCtx,
            activeProperty,
            expandedActiveProperty,
            element: nv,
            expandedParent,
            options,
            insideList,
            typeScopedContext,
            typeKey,
            expansionMap});
        }
      }
    }

    /**
     * Expands the given value by using the coercion and keyword rules in the
     * given context.
     *
     * @param activeCtx the active context to use.
     * @param activeProperty the active property the value is associated with.
     * @param value the value to expand.
     * @param {Object} [options] - processing options.
     *
     * @return the expanded value.
     */
    function _expandValue({activeCtx, activeProperty, value, options}) {
      // nothing to expand
      if(value === null || value === undefined) {
        return null;
      }

      // special-case expand @id and @type (skips '@id' expansion)
      const expandedProperty = _expandIri$2(
        activeCtx, activeProperty, {vocab: true}, options);
      if(expandedProperty === '@id') {
        return _expandIri$2(activeCtx, value, {base: true}, options);
      } else if(expandedProperty === '@type') {
        return _expandIri$2(activeCtx, value, {vocab: true, base: true}, options);
      }

      // get type definition from context
      const type = _getContextValue$1(activeCtx, activeProperty, '@type');

      // do @id expansion (automatic for @graph)
      if((type === '@id' || expandedProperty === '@graph') && _isString$2(value)) {
        return {'@id': _expandIri$2(activeCtx, value, {base: true}, options)};
      }
      // do @id expansion w/vocab
      if(type === '@vocab' && _isString$2(value)) {
        return {
          '@id': _expandIri$2(activeCtx, value, {vocab: true, base: true}, options)
        };
      }

      // do not expand keyword values
      if(_isKeyword$1(expandedProperty)) {
        return value;
      }

      const rval = {};

      if(type && !['@id', '@vocab', '@none'].includes(type)) {
        // other type
        rval['@type'] = type;
      } else if(_isString$2(value)) {
        // check for language tagging for strings
        const language = _getContextValue$1(activeCtx, activeProperty, '@language');
        if(language !== null) {
          rval['@language'] = language;
        }
        const direction = _getContextValue$1(activeCtx, activeProperty, '@direction');
        if(direction !== null) {
          rval['@direction'] = direction;
        }
      }
      // do conversion of values that aren't basic JSON types to strings
      if(!['boolean', 'number', 'string'].includes(typeof value)) {
        value = value.toString();
      }
      rval['@value'] = value;

      return rval;
    }

    /**
     * Expands a language map.
     *
     * @param activeCtx the active context to use.
     * @param languageMap the language map to expand.
     * @param direction the direction to apply to values.
     * @param {Object} [options] - processing options.
     *
     * @return the expanded language map.
     */
    function _expandLanguageMap(activeCtx, languageMap, direction, options) {
      const rval = [];
      const keys = Object.keys(languageMap).sort();
      for(const key of keys) {
        const expandedKey = _expandIri$2(activeCtx, key, {vocab: true}, options);
        let val = languageMap[key];
        if(!_isArray$2(val)) {
          val = [val];
        }
        for(const item of val) {
          if(item === null) {
            // null values are allowed (8.5) but ignored (3.1)
            continue;
          }
          if(!_isString$2(item)) {
            throw new JsonLdError_1(
              'Invalid JSON-LD syntax; language map values must be strings.',
              'jsonld.SyntaxError',
              {code: 'invalid language map value', languageMap});
          }
          const val = {'@value': item};
          if(expandedKey !== '@none') {
            val['@language'] = key.toLowerCase();
          }
          if(direction) {
            val['@direction'] = direction;
          }
          rval.push(val);
        }
      }
      return rval;
    }

    async function _expandIndexMap(
      {activeCtx, options, activeProperty, value, expansionMap, asGraph,
        indexKey, propertyIndex}) {
      const rval = [];
      const keys = Object.keys(value).sort();
      const isTypeIndex = indexKey === '@type';
      for(let key of keys) {
        // if indexKey is @type, there may be a context defined for it
        if(isTypeIndex) {
          const ctx = _getContextValue$1(activeCtx, key, '@context');
          if(!_isUndefined$1(ctx)) {
            activeCtx = await _processContext$2({
              activeCtx,
              localCtx: ctx,
              propagate: false,
              options
            });
          }
        }

        let val = value[key];
        if(!_isArray$2(val)) {
          val = [val];
        }

        val = await api$6.expand({
          activeCtx,
          activeProperty,
          element: val,
          options,
          insideList: false,
          insideIndex: true,
          expansionMap
        });

        // expand for @type, but also for @none
        let expandedKey;
        if(propertyIndex) {
          if(key === '@none') {
            expandedKey = '@none';
          } else {
            expandedKey = _expandValue(
              {activeCtx, activeProperty: indexKey, value: key, options});
          }
        } else {
          expandedKey = _expandIri$2(activeCtx, key, {vocab: true}, options);
        }

        if(indexKey === '@id') {
          // expand document relative
          key = _expandIri$2(activeCtx, key, {base: true}, options);
        } else if(isTypeIndex) {
          key = expandedKey;
        }

        for(let item of val) {
          // If this is also a @graph container, turn items into graphs
          if(asGraph && !_isGraph$1(item)) {
            item = {'@graph': [item]};
          }
          if(indexKey === '@type') {
            if(expandedKey === '@none') ; else if(item['@type']) {
              item['@type'] = [key].concat(item['@type']);
            } else {
              item['@type'] = [key];
            }
          } else if(_isValue$1(item) &&
            !['@language', '@type', '@index'].includes(indexKey)) {
            throw new JsonLdError_1(
              'Invalid JSON-LD syntax; Attempt to add illegal key to value ' +
              `object: "${indexKey}".`,
              'jsonld.SyntaxError',
              {code: 'invalid value object', value: item});
          } else if(propertyIndex) {
            // index is a property to be expanded, and values interpreted for that
            // property
            if(expandedKey !== '@none') {
              // expand key as a value
              _addValue$1(item, propertyIndex, expandedKey, {
                propertyIsArray: true,
                prependValue: true
              });
            }
          } else if(expandedKey !== '@none' && !(indexKey in item)) {
            item[indexKey] = key;
          }
          rval.push(item);
        }
      }
      return rval;
    }

    /*
     * Copyright (c) 2017 Digital Bazaar, Inc. All rights reserved.
     */

    const {isKeyword: isKeyword$2} = context;





    const api$5 = {};
    var nodeMap = api$5;

    /**
     * Creates a merged JSON-LD node map (node ID => node).
     *
     * @param input the expanded JSON-LD to create a node map of.
     * @param [options] the options to use:
     *          [issuer] a jsonld.IdentifierIssuer to use to label blank nodes.
     *
     * @return the node map.
     */
    api$5.createMergedNodeMap = (input, options) => {
      options = options || {};

      // produce a map of all subjects and name each bnode
      const issuer = options.issuer || new util.IdentifierIssuer('_:b');
      const graphs = {'@default': {}};
      api$5.createNodeMap(input, graphs, '@default', issuer);

      // add all non-default graphs to default graph
      return api$5.mergeNodeMaps(graphs);
    };

    /**
     * Recursively flattens the subjects in the given JSON-LD expanded input
     * into a node map.
     *
     * @param input the JSON-LD expanded input.
     * @param graphs a map of graph name to subject map.
     * @param graph the name of the current graph.
     * @param issuer the blank node identifier issuer.
     * @param name the name assigned to the current input if it is a bnode.
     * @param list the list to append to, null for none.
     */
    api$5.createNodeMap = (input, graphs, graph, issuer, name, list) => {
      // recurse through array
      if(types.isArray(input)) {
        for(const node of input) {
          api$5.createNodeMap(node, graphs, graph, issuer, undefined, list);
        }
        return;
      }

      // add non-object to list
      if(!types.isObject(input)) {
        if(list) {
          list.push(input);
        }
        return;
      }

      // add values to list
      if(graphTypes.isValue(input)) {
        if('@type' in input) {
          let type = input['@type'];
          // rename @type blank node
          if(type.indexOf('_:') === 0) {
            input['@type'] = type = issuer.getId(type);
          }
        }
        if(list) {
          list.push(input);
        }
        return;
      } else if(list && graphTypes.isList(input)) {
        const _list = [];
        api$5.createNodeMap(input['@list'], graphs, graph, issuer, name, _list);
        list.push({'@list': _list});
        return;
      }

      // Note: At this point, input must be a subject.

      // spec requires @type to be named first, so assign names early
      if('@type' in input) {
        const types = input['@type'];
        for(const type of types) {
          if(type.indexOf('_:') === 0) {
            issuer.getId(type);
          }
        }
      }

      // get name for subject
      if(types.isUndefined(name)) {
        name = graphTypes.isBlankNode(input) ?
          issuer.getId(input['@id']) : input['@id'];
      }

      // add subject reference to list
      if(list) {
        list.push({'@id': name});
      }

      // create new subject or merge into existing one
      const subjects = graphs[graph];
      const subject = subjects[name] = subjects[name] || {};
      subject['@id'] = name;
      const properties = Object.keys(input).sort();
      for(let property of properties) {
        // skip @id
        if(property === '@id') {
          continue;
        }

        // handle reverse properties
        if(property === '@reverse') {
          const referencedNode = {'@id': name};
          const reverseMap = input['@reverse'];
          for(const reverseProperty in reverseMap) {
            const items = reverseMap[reverseProperty];
            for(const item of items) {
              let itemName = item['@id'];
              if(graphTypes.isBlankNode(item)) {
                itemName = issuer.getId(itemName);
              }
              api$5.createNodeMap(item, graphs, graph, issuer, itemName);
              util.addValue(
                subjects[itemName], reverseProperty, referencedNode,
                {propertyIsArray: true, allowDuplicate: false});
            }
          }
          continue;
        }

        // recurse into graph
        if(property === '@graph') {
          // add graph subjects map entry
          if(!(name in graphs)) {
            graphs[name] = {};
          }
          api$5.createNodeMap(input[property], graphs, name, issuer);
          continue;
        }

        // recurse into included
        if(property === '@included') {
          api$5.createNodeMap(input[property], graphs, graph, issuer);
          continue;
        }

        // copy non-@type keywords
        if(property !== '@type' && isKeyword$2(property)) {
          if(property === '@index' && property in subject &&
            (input[property] !== subject[property] ||
            input[property]['@id'] !== subject[property]['@id'])) {
            throw new JsonLdError_1(
              'Invalid JSON-LD syntax; conflicting @index property detected.',
              'jsonld.SyntaxError',
              {code: 'conflicting indexes', subject});
          }
          subject[property] = input[property];
          continue;
        }

        // iterate over objects
        const objects = input[property];

        // if property is a bnode, assign it a new id
        if(property.indexOf('_:') === 0) {
          property = issuer.getId(property);
        }

        // ensure property is added for empty arrays
        if(objects.length === 0) {
          util.addValue(subject, property, [], {propertyIsArray: true});
          continue;
        }
        for(let o of objects) {
          if(property === '@type') {
            // rename @type blank nodes
            o = (o.indexOf('_:') === 0) ? issuer.getId(o) : o;
          }

          // handle embedded subject or subject reference
          if(graphTypes.isSubject(o) || graphTypes.isSubjectReference(o)) {
            // skip null @id
            if('@id' in o && !o['@id']) {
              continue;
            }

            // relabel blank node @id
            const id = graphTypes.isBlankNode(o) ?
              issuer.getId(o['@id']) : o['@id'];

            // add reference and recurse
            util.addValue(
              subject, property, {'@id': id},
              {propertyIsArray: true, allowDuplicate: false});
            api$5.createNodeMap(o, graphs, graph, issuer, id);
          } else if(graphTypes.isValue(o)) {
            util.addValue(
              subject, property, o,
              {propertyIsArray: true, allowDuplicate: false});
          } else if(graphTypes.isList(o)) {
            // handle @list
            const _list = [];
            api$5.createNodeMap(o['@list'], graphs, graph, issuer, name, _list);
            o = {'@list': _list};
            util.addValue(
              subject, property, o,
              {propertyIsArray: true, allowDuplicate: false});
          } else {
            // handle @value
            api$5.createNodeMap(o, graphs, graph, issuer, name);
            util.addValue(
              subject, property, o, {propertyIsArray: true, allowDuplicate: false});
          }
        }
      }
    };

    /**
     * Merge separate named graphs into a single merged graph including
     * all nodes from the default graph and named graphs.
     *
     * @param graphs a map of graph name to subject map.
     *
     * @return the merged graph map.
     */
    api$5.mergeNodeMapGraphs = graphs => {
      const merged = {};
      for(const name of Object.keys(graphs).sort()) {
        for(const id of Object.keys(graphs[name]).sort()) {
          const node = graphs[name][id];
          if(!(id in merged)) {
            merged[id] = {'@id': id};
          }
          const mergedNode = merged[id];

          for(const property of Object.keys(node).sort()) {
            if(isKeyword$2(property) && property !== '@type') {
              // copy keywords
              mergedNode[property] = util.clone(node[property]);
            } else {
              // merge objects
              for(const value of node[property]) {
                util.addValue(
                  mergedNode, property, util.clone(value),
                  {propertyIsArray: true, allowDuplicate: false});
              }
            }
          }
        }
      }

      return merged;
    };

    api$5.mergeNodeMaps = graphs => {
      // add all non-default graphs to default graph
      const defaultGraph = graphs['@default'];
      const graphNames = Object.keys(graphs).sort();
      for(const graphName of graphNames) {
        if(graphName === '@default') {
          continue;
        }
        const nodeMap = graphs[graphName];
        let subject = defaultGraph[graphName];
        if(!subject) {
          defaultGraph[graphName] = subject = {
            '@id': graphName,
            '@graph': []
          };
        } else if(!('@graph' in subject)) {
          subject['@graph'] = [];
        }
        const graph = subject['@graph'];
        for(const id of Object.keys(nodeMap).sort()) {
          const node = nodeMap[id];
          // only add full subjects
          if(!graphTypes.isSubjectReference(node)) {
            graph.push(node);
          }
        }
      }
      return defaultGraph;
    };

    /*
     * Copyright (c) 2017 Digital Bazaar, Inc. All rights reserved.
     */

    const {
      isSubjectReference: _isSubjectReference$2
    } = graphTypes;

    const {
      createMergedNodeMap: _createMergedNodeMap$1
    } = nodeMap;

    const api$4 = {};
    var flatten = api$4;

    /**
     * Performs JSON-LD flattening.
     *
     * @param input the expanded JSON-LD to flatten.
     *
     * @return the flattened output.
     */
    api$4.flatten = input => {
      const defaultGraph = _createMergedNodeMap$1(input);

      // produce flattened output
      const flattened = [];
      const keys = Object.keys(defaultGraph).sort();
      for(let ki = 0; ki < keys.length; ++ki) {
        const node = defaultGraph[keys[ki]];
        // only add full subjects to top-level
        if(!_isSubjectReference$2(node)) {
          flattened.push(node);
        }
      }
      return flattened;
    };

    /*
     * Copyright (c) 2017 Digital Bazaar, Inc. All rights reserved.
     */






    // constants
    const {
      // RDF,
      RDF_LIST,
      RDF_FIRST: RDF_FIRST$1,
      RDF_REST: RDF_REST$1,
      RDF_NIL: RDF_NIL$1,
      RDF_TYPE: RDF_TYPE$1,
      // RDF_PLAIN_LITERAL,
      // RDF_XML_LITERAL,
      RDF_JSON_LITERAL: RDF_JSON_LITERAL$1,
      // RDF_OBJECT,
      // RDF_LANGSTRING,

      // XSD,
      XSD_BOOLEAN: XSD_BOOLEAN$1,
      XSD_DOUBLE: XSD_DOUBLE$1,
      XSD_INTEGER: XSD_INTEGER$1,
      XSD_STRING: XSD_STRING$1,
    } = constants;

    const REGEX_BCP47 = /^[a-zA-Z]{1,8}(-[a-zA-Z0-9]{1,8})*$/;

    const api$3 = {};
    var fromRdf = api$3;

    /**
     * Converts an RDF dataset to JSON-LD.
     *
     * @param dataset the RDF dataset.
     * @param options the RDF serialization options.
     *
     * @return a Promise that resolves to the JSON-LD output.
     */
    api$3.fromRDF = async (
      dataset,
      {
        useRdfType = false,
        useNativeTypes = false,
        rdfDirection = null
      }
    ) => {
      const defaultGraph = {};
      const graphMap = {'@default': defaultGraph};
      const referencedOnce = {};

      for(const quad of dataset) {
        // TODO: change 'name' to 'graph'
        const name = (quad.graph.termType === 'DefaultGraph') ?
          '@default' : quad.graph.value;
        if(!(name in graphMap)) {
          graphMap[name] = {};
        }
        if(name !== '@default' && !(name in defaultGraph)) {
          defaultGraph[name] = {'@id': name};
        }

        const nodeMap = graphMap[name];

        // get subject, predicate, object
        const s = quad.subject.value;
        const p = quad.predicate.value;
        const o = quad.object;

        if(!(s in nodeMap)) {
          nodeMap[s] = {'@id': s};
        }
        const node = nodeMap[s];

        const objectIsNode = o.termType.endsWith('Node');
        if(objectIsNode && !(o.value in nodeMap)) {
          nodeMap[o.value] = {'@id': o.value};
        }

        if(p === RDF_TYPE$1 && !useRdfType && objectIsNode) {
          util.addValue(node, '@type', o.value, {propertyIsArray: true});
          continue;
        }

        const value = _RDFToObject(o, useNativeTypes, rdfDirection);
        util.addValue(node, p, value, {propertyIsArray: true});

        // object may be an RDF list/partial list node but we can't know easily
        // until all triples are read
        if(objectIsNode) {
          if(o.value === RDF_NIL$1) {
            // track rdf:nil uniquely per graph
            const object = nodeMap[o.value];
            if(!('usages' in object)) {
              object.usages = [];
            }
            object.usages.push({
              node,
              property: p,
              value
            });
          } else if(o.value in referencedOnce) {
            // object referenced more than once
            referencedOnce[o.value] = false;
          } else {
            // keep track of single reference
            referencedOnce[o.value] = {
              node,
              property: p,
              value
            };
          }
        }
      }

      /*
      for(let name in dataset) {
        const graph = dataset[name];
        if(!(name in graphMap)) {
          graphMap[name] = {};
        }
        if(name !== '@default' && !(name in defaultGraph)) {
          defaultGraph[name] = {'@id': name};
        }
        const nodeMap = graphMap[name];
        for(let ti = 0; ti < graph.length; ++ti) {
          const triple = graph[ti];

          // get subject, predicate, object
          const s = triple.subject.value;
          const p = triple.predicate.value;
          const o = triple.object;

          if(!(s in nodeMap)) {
            nodeMap[s] = {'@id': s};
          }
          const node = nodeMap[s];

          const objectIsId = (o.type === 'IRI' || o.type === 'blank node');
          if(objectIsId && !(o.value in nodeMap)) {
            nodeMap[o.value] = {'@id': o.value};
          }

          if(p === RDF_TYPE && !useRdfType && objectIsId) {
            util.addValue(node, '@type', o.value, {propertyIsArray: true});
            continue;
          }

          const value = _RDFToObject(o, useNativeTypes);
          util.addValue(node, p, value, {propertyIsArray: true});

          // object may be an RDF list/partial list node but we can't know easily
          // until all triples are read
          if(objectIsId) {
            if(o.value === RDF_NIL) {
              // track rdf:nil uniquely per graph
              const object = nodeMap[o.value];
              if(!('usages' in object)) {
                object.usages = [];
              }
              object.usages.push({
                node: node,
                property: p,
                value: value
              });
            } else if(o.value in referencedOnce) {
              // object referenced more than once
              referencedOnce[o.value] = false;
            } else {
              // keep track of single reference
              referencedOnce[o.value] = {
                node: node,
                property: p,
                value: value
              };
            }
          }
        }
      }*/

      // convert linked lists to @list arrays
      for(const name in graphMap) {
        const graphObject = graphMap[name];

        // no @lists to be converted, continue
        if(!(RDF_NIL$1 in graphObject)) {
          continue;
        }

        // iterate backwards through each RDF list
        const nil = graphObject[RDF_NIL$1];
        if(!nil.usages) {
          continue;
        }
        for(let usage of nil.usages) {
          let node = usage.node;
          let property = usage.property;
          let head = usage.value;
          const list = [];
          const listNodes = [];

          // ensure node is a well-formed list node; it must:
          // 1. Be referenced only once.
          // 2. Have an array for rdf:first that has 1 item.
          // 3. Have an array for rdf:rest that has 1 item.
          // 4. Have no keys other than: @id, rdf:first, rdf:rest, and,
          //   optionally, @type where the value is rdf:List.
          let nodeKeyCount = Object.keys(node).length;
          while(property === RDF_REST$1 &&
            types.isObject(referencedOnce[node['@id']]) &&
            types.isArray(node[RDF_FIRST$1]) && node[RDF_FIRST$1].length === 1 &&
            types.isArray(node[RDF_REST$1]) && node[RDF_REST$1].length === 1 &&
            (nodeKeyCount === 3 ||
              (nodeKeyCount === 4 && types.isArray(node['@type']) &&
              node['@type'].length === 1 && node['@type'][0] === RDF_LIST))) {
            list.push(node[RDF_FIRST$1][0]);
            listNodes.push(node['@id']);

            // get next node, moving backwards through list
            usage = referencedOnce[node['@id']];
            node = usage.node;
            property = usage.property;
            head = usage.value;
            nodeKeyCount = Object.keys(node).length;

            // if node is not a blank node, then list head found
            if(!graphTypes.isBlankNode(node)) {
              break;
            }
          }

          // transform list into @list object
          delete head['@id'];
          head['@list'] = list.reverse();
          for(const listNode of listNodes) {
            delete graphObject[listNode];
          }
        }

        delete nil.usages;
      }

      const result = [];
      const subjects = Object.keys(defaultGraph).sort();
      for(const subject of subjects) {
        const node = defaultGraph[subject];
        if(subject in graphMap) {
          const graph = node['@graph'] = [];
          const graphObject = graphMap[subject];
          const graphSubjects = Object.keys(graphObject).sort();
          for(const graphSubject of graphSubjects) {
            const node = graphObject[graphSubject];
            // only add full subjects to top-level
            if(!graphTypes.isSubjectReference(node)) {
              graph.push(node);
            }
          }
        }
        // only add full subjects to top-level
        if(!graphTypes.isSubjectReference(node)) {
          result.push(node);
        }
      }

      return result;
    };

    /**
     * Converts an RDF triple object to a JSON-LD object.
     *
     * @param o the RDF triple object to convert.
     * @param useNativeTypes true to output native types, false not to.
     *
     * @return the JSON-LD object.
     */
    function _RDFToObject(o, useNativeTypes, rdfDirection) {
      // convert NamedNode/BlankNode object to JSON-LD
      if(o.termType.endsWith('Node')) {
        return {'@id': o.value};
      }

      // convert literal to JSON-LD
      const rval = {'@value': o.value};

      // add language
      if(o.language) {
        rval['@language'] = o.language;
      } else {
        let type = o.datatype.value;
        if(!type) {
          type = XSD_STRING$1;
        }
        if(type === RDF_JSON_LITERAL$1) {
          type = '@json';
          try {
            rval['@value'] = JSON.parse(rval['@value']);
          } catch(e) {
            throw new JsonLdError_1(
              'JSON literal could not be parsed.',
              'jsonld.InvalidJsonLiteral',
              {code: 'invalid JSON literal', value: rval['@value'], cause: e});
          }
        }
        // use native types for certain xsd types
        if(useNativeTypes) {
          if(type === XSD_BOOLEAN$1) {
            if(rval['@value'] === 'true') {
              rval['@value'] = true;
            } else if(rval['@value'] === 'false') {
              rval['@value'] = false;
            }
          } else if(types.isNumeric(rval['@value'])) {
            if(type === XSD_INTEGER$1) {
              const i = parseInt(rval['@value'], 10);
              if(i.toFixed(0) === rval['@value']) {
                rval['@value'] = i;
              }
            } else if(type === XSD_DOUBLE$1) {
              rval['@value'] = parseFloat(rval['@value']);
            }
          }
          // do not add native type
          if(![XSD_BOOLEAN$1, XSD_INTEGER$1, XSD_DOUBLE$1, XSD_STRING$1].includes(type)) {
            rval['@type'] = type;
          }
        } else if(rdfDirection === 'i18n-datatype' &&
          type.startsWith('https://www.w3.org/ns/i18n#')) {
          const [, language, direction] = type.split(/[#_]/);
          if(language.length > 0) {
            rval['@language'] = language;
            if(!language.match(REGEX_BCP47)) {
              console.warn(`@language must be valid BCP47: ${language}`);
            }
          }
          rval['@direction'] = direction;
        } else if(type !== XSD_STRING$1) {
          rval['@type'] = type;
        }
      }

      return rval;
    }

    /* jshint esversion: 6 */

    var canonicalize = function serialize (object) {
      if (object === null || typeof object !== 'object' || object.toJSON != null) {
        return JSON.stringify(object);
      }

      if (Array.isArray(object)) {
        return '[' + object.reduce((t, cv, ci) => {
          const comma = ci === 0 ? '' : ',';
          const value = cv === undefined || typeof cv === 'symbol' ? null : cv;
          return t + comma + serialize(value);
        }, '') + ']';
      }

      return '{' + Object.keys(object).sort().reduce((t, cv, ci) => {
        if (object[cv] === undefined ||
            typeof object[cv] === 'symbol') {
          return t;
        }
        const comma = t.length === 0 ? '' : ',';
        return t + comma + serialize(cv) + ':' + serialize(object[cv]);
      }, '') + '}';
    };

    /*
     * Copyright (c) 2017 Digital Bazaar, Inc. All rights reserved.
     */

    const {createNodeMap} = nodeMap;
    const {isKeyword: isKeyword$1} = context;





    const {
      // RDF,
      // RDF_LIST,
      RDF_FIRST,
      RDF_REST,
      RDF_NIL,
      RDF_TYPE,
      // RDF_PLAIN_LITERAL,
      // RDF_XML_LITERAL,
      RDF_JSON_LITERAL,
      // RDF_OBJECT,
      RDF_LANGSTRING,

      // XSD,
      XSD_BOOLEAN,
      XSD_DOUBLE,
      XSD_INTEGER,
      XSD_STRING,
    } = constants;

    const {
      isAbsolute: _isAbsoluteIri
    } = url;

    const api$2 = {};
    var toRdf = api$2;

    /**
     * Outputs an RDF dataset for the expanded JSON-LD input.
     *
     * @param input the expanded JSON-LD input.
     * @param options the RDF serialization options.
     *
     * @return the RDF dataset.
     */
    api$2.toRDF = (input, options) => {
      // create node map for default graph (and any named graphs)
      const issuer = new util.IdentifierIssuer('_:b');
      const nodeMap = {'@default': {}};
      createNodeMap(input, nodeMap, '@default', issuer);

      const dataset = [];
      const graphNames = Object.keys(nodeMap).sort();
      for(const graphName of graphNames) {
        let graphTerm;
        if(graphName === '@default') {
          graphTerm = {termType: 'DefaultGraph', value: ''};
        } else if(_isAbsoluteIri(graphName)) {
          if(graphName.startsWith('_:')) {
            graphTerm = {termType: 'BlankNode'};
          } else {
            graphTerm = {termType: 'NamedNode'};
          }
          graphTerm.value = graphName;
        } else {
          // skip relative IRIs (not valid RDF)
          continue;
        }
        _graphToRDF(dataset, nodeMap[graphName], graphTerm, issuer, options);
      }

      return dataset;
    };

    /**
     * Adds RDF quads for a particular graph to the given dataset.
     *
     * @param dataset the dataset to append RDF quads to.
     * @param graph the graph to create RDF quads for.
     * @param graphTerm the graph term for each quad.
     * @param issuer a IdentifierIssuer for assigning blank node names.
     * @param options the RDF serialization options.
     *
     * @return the array of RDF triples for the given graph.
     */
    function _graphToRDF(dataset, graph, graphTerm, issuer, options) {
      const ids = Object.keys(graph).sort();
      for(const id of ids) {
        const node = graph[id];
        const properties = Object.keys(node).sort();
        for(let property of properties) {
          const items = node[property];
          if(property === '@type') {
            property = RDF_TYPE;
          } else if(isKeyword$1(property)) {
            continue;
          }

          for(const item of items) {
            // RDF subject
            const subject = {
              termType: id.startsWith('_:') ? 'BlankNode' : 'NamedNode',
              value: id
            };

            // skip relative IRI subjects (not valid RDF)
            if(!_isAbsoluteIri(id)) {
              continue;
            }

            // RDF predicate
            const predicate = {
              termType: property.startsWith('_:') ? 'BlankNode' : 'NamedNode',
              value: property
            };

            // skip relative IRI predicates (not valid RDF)
            if(!_isAbsoluteIri(property)) {
              continue;
            }

            // skip blank node predicates unless producing generalized RDF
            if(predicate.termType === 'BlankNode' &&
              !options.produceGeneralizedRdf) {
              continue;
            }

            // convert list, value or node object to triple
            const object =
              _objectToRDF(item, issuer, dataset, graphTerm, options.rdfDirection);
            // skip null objects (they are relative IRIs)
            if(object) {
              dataset.push({
                subject,
                predicate,
                object,
                graph: graphTerm
              });
            }
          }
        }
      }
    }

    /**
     * Converts a @list value into linked list of blank node RDF quads
     * (an RDF collection).
     *
     * @param list the @list value.
     * @param issuer a IdentifierIssuer for assigning blank node names.
     * @param dataset the array of quads to append to.
     * @param graphTerm the graph term for each quad.
     *
     * @return the head of the list.
     */
    function _listToRDF(list, issuer, dataset, graphTerm, rdfDirection) {
      const first = {termType: 'NamedNode', value: RDF_FIRST};
      const rest = {termType: 'NamedNode', value: RDF_REST};
      const nil = {termType: 'NamedNode', value: RDF_NIL};

      const last = list.pop();
      // Result is the head of the list
      const result = last ? {termType: 'BlankNode', value: issuer.getId()} : nil;
      let subject = result;

      for(const item of list) {
        const object = _objectToRDF(item, issuer, dataset, graphTerm, rdfDirection);
        const next = {termType: 'BlankNode', value: issuer.getId()};
        dataset.push({
          subject,
          predicate: first,
          object,
          graph: graphTerm
        });
        dataset.push({
          subject,
          predicate: rest,
          object: next,
          graph: graphTerm
        });
        subject = next;
      }

      // Tail of list
      if(last) {
        const object = _objectToRDF(last, issuer, dataset, graphTerm, rdfDirection);
        dataset.push({
          subject,
          predicate: first,
          object,
          graph: graphTerm
        });
        dataset.push({
          subject,
          predicate: rest,
          object: nil,
          graph: graphTerm
        });
      }

      return result;
    }

    /**
     * Converts a JSON-LD value object to an RDF literal or a JSON-LD string,
     * node object to an RDF resource, or adds a list.
     *
     * @param item the JSON-LD value or node object.
     * @param issuer a IdentifierIssuer for assigning blank node names.
     * @param dataset the dataset to append RDF quads to.
     * @param graphTerm the graph term for each quad.
     *
     * @return the RDF literal or RDF resource.
     */
    function _objectToRDF(item, issuer, dataset, graphTerm, rdfDirection) {
      const object = {};

      // convert value object to RDF
      if(graphTypes.isValue(item)) {
        object.termType = 'Literal';
        object.value = undefined;
        object.datatype = {
          termType: 'NamedNode'
        };
        let value = item['@value'];
        const datatype = item['@type'] || null;

        // convert to XSD/JSON datatypes as appropriate
        if(datatype === '@json') {
          object.value = canonicalize(value);
          object.datatype.value = RDF_JSON_LITERAL;
        } else if(types.isBoolean(value)) {
          object.value = value.toString();
          object.datatype.value = datatype || XSD_BOOLEAN;
        } else if(types.isDouble(value) || datatype === XSD_DOUBLE) {
          if(!types.isDouble(value)) {
            value = parseFloat(value);
          }
          // canonical double representation
          object.value = value.toExponential(15).replace(/(\d)0*e\+?/, '$1E');
          object.datatype.value = datatype || XSD_DOUBLE;
        } else if(types.isNumber(value)) {
          object.value = value.toFixed(0);
          object.datatype.value = datatype || XSD_INTEGER;
        } else if(rdfDirection === 'i18n-datatype' &&
          '@direction' in item) {
          const datatype = 'https://www.w3.org/ns/i18n#' +
            (item['@language'] || '') +
            `_${item['@direction']}`;
          object.datatype.value = datatype;
          object.value = value;
        } else if('@language' in item) {
          object.value = value;
          object.datatype.value = datatype || RDF_LANGSTRING;
          object.language = item['@language'];
        } else {
          object.value = value;
          object.datatype.value = datatype || XSD_STRING;
        }
      } else if(graphTypes.isList(item)) {
        const _list =
          _listToRDF(item['@list'], issuer, dataset, graphTerm, rdfDirection);
        object.termType = _list.termType;
        object.value = _list.value;
      } else {
        // convert string/node object to RDF
        const id = types.isObject(item) ? item['@id'] : item;
        object.termType = id.startsWith('_:') ? 'BlankNode' : 'NamedNode';
        object.value = id;
      }

      // skip relative IRIs, not valid RDF
      if(object.termType === 'NamedNode' && !_isAbsoluteIri(object.value)) {
        return null;
      }

      return object;
    }

    /*
     * Copyright (c) 2017 Digital Bazaar, Inc. All rights reserved.
     */

    const {isKeyword} = context;





    const {
      createNodeMap: _createNodeMap$1,
      mergeNodeMapGraphs: _mergeNodeMapGraphs
    } = nodeMap;

    const api$1 = {};
    var frame = api$1;

    /**
     * Performs JSON-LD `merged` framing.
     *
     * @param input the expanded JSON-LD to frame.
     * @param frame the expanded JSON-LD frame to use.
     * @param options the framing options.
     *
     * @return the framed output.
     */
    api$1.frameMergedOrDefault = (input, frame, options) => {
      // create framing state
      const state = {
        options,
        embedded: false,
        graph: '@default',
        graphMap: {'@default': {}},
        subjectStack: [],
        link: {},
        bnodeMap: {}
      };

      // produce a map of all graphs and name each bnode
      // FIXME: currently uses subjects from @merged graph only
      const issuer = new util.IdentifierIssuer('_:b');
      _createNodeMap$1(input, state.graphMap, '@default', issuer);
      if(options.merged) {
        state.graphMap['@merged'] = _mergeNodeMapGraphs(state.graphMap);
        state.graph = '@merged';
      }
      state.subjects = state.graphMap[state.graph];

      // frame the subjects
      const framed = [];
      api$1.frame(state, Object.keys(state.subjects).sort(), frame, framed);

      // If pruning blank nodes, find those to prune
      if(options.pruneBlankNodeIdentifiers) {
        // remove all blank nodes appearing only once, done in compaction
        options.bnodesToClear =
          Object.keys(state.bnodeMap).filter(id => state.bnodeMap[id].length === 1);
      }

      // remove @preserve from results
      options.link = {};
      return _cleanupPreserve(framed, options);
    };

    /**
     * Frames subjects according to the given frame.
     *
     * @param state the current framing state.
     * @param subjects the subjects to filter.
     * @param frame the frame.
     * @param parent the parent subject or top-level array.
     * @param property the parent property, initialized to null.
     */
    api$1.frame = (state, subjects, frame, parent, property = null) => {
      // validate the frame
      _validateFrame(frame);
      frame = frame[0];

      // get flags for current frame
      const options = state.options;
      const flags = {
        embed: _getFrameFlag(frame, options, 'embed'),
        explicit: _getFrameFlag(frame, options, 'explicit'),
        requireAll: _getFrameFlag(frame, options, 'requireAll')
      };

      // get link for current graph
      if(!state.link.hasOwnProperty(state.graph)) {
        state.link[state.graph] = {};
      }
      const link = state.link[state.graph];

      // filter out subjects that match the frame
      const matches = _filterSubjects(state, subjects, frame, flags);

      // add matches to output
      const ids = Object.keys(matches).sort();
      for(const id of ids) {
        const subject = matches[id];

        /* Note: In order to treat each top-level match as a compartmentalized
        result, clear the unique embedded subjects map when the property is null,
        which only occurs at the top-level. */
        if(property === null) {
          state.uniqueEmbeds = {[state.graph]: {}};
        } else {
          state.uniqueEmbeds[state.graph] = state.uniqueEmbeds[state.graph] || {};
        }

        if(flags.embed === '@link' && id in link) {
          // TODO: may want to also match an existing linked subject against
          // the current frame ... so different frames could produce different
          // subjects that are only shared in-memory when the frames are the same

          // add existing linked subject
          _addFrameOutput(parent, property, link[id]);
          continue;
        }

        // start output for subject
        const output = {'@id': id};
        if(id.indexOf('_:') === 0) {
          util.addValue(state.bnodeMap, id, output, {propertyIsArray: true});
        }
        link[id] = output;

        // validate @embed
        if((flags.embed === '@first' || flags.embed === '@last') && state.is11) {
          throw new JsonLdError_1(
            'Invalid JSON-LD syntax; invalid value of @embed.',
            'jsonld.SyntaxError', {code: 'invalid @embed value', frame});
        }

        if(!state.embedded && state.uniqueEmbeds[state.graph].hasOwnProperty(id)) {
          // skip adding this node object to the top level, as it was
          // already included in another node object
          continue;
        }

        // if embed is @never or if a circular reference would be created by an
        // embed, the subject cannot be embedded, just add the reference;
        // note that a circular reference won't occur when the embed flag is
        // `@link` as the above check will short-circuit before reaching this point
        if(state.embedded &&
          (flags.embed === '@never' ||
          _createsCircularReference(subject, state.graph, state.subjectStack))) {
          _addFrameOutput(parent, property, output);
          continue;
        }

        // if only the first (or once) should be embedded
        if(state.embedded &&
           (flags.embed == '@first' || flags.embed == '@once') &&
           state.uniqueEmbeds[state.graph].hasOwnProperty(id)) {
          _addFrameOutput(parent, property, output);
          continue;
        }

        // if only the last match should be embedded
        if(flags.embed === '@last') {
          // remove any existing embed
          if(id in state.uniqueEmbeds[state.graph]) {
            _removeEmbed(state, id);
          }
        }

        state.uniqueEmbeds[state.graph][id] = {parent, property};

        // push matching subject onto stack to enable circular embed checks
        state.subjectStack.push({subject, graph: state.graph});

        // subject is also the name of a graph
        if(id in state.graphMap) {
          let recurse = false;
          let subframe = null;
          if(!('@graph' in frame)) {
            recurse = state.graph !== '@merged';
            subframe = {};
          } else {
            subframe = frame['@graph'][0];
            recurse = !(id === '@merged' || id === '@default');
            if(!types.isObject(subframe)) {
              subframe = {};
            }
          }

          if(recurse) {
            // recurse into graph
            api$1.frame(
              {...state, graph: id, embedded: false},
              Object.keys(state.graphMap[id]).sort(), [subframe], output, '@graph');
          }
        }

        // if frame has @included, recurse over its sub-frame
        if('@included' in frame) {
          api$1.frame(
            {...state, embedded: false},
            subjects, frame['@included'], output, '@included');
        }

        // iterate over subject properties
        for(const prop of Object.keys(subject).sort()) {
          // copy keywords to output
          if(isKeyword(prop)) {
            output[prop] = util.clone(subject[prop]);

            if(prop === '@type') {
              // count bnode values of @type
              for(const type of subject['@type']) {
                if(type.indexOf('_:') === 0) {
                  util.addValue(
                    state.bnodeMap, type, output, {propertyIsArray: true});
                }
              }
            }
            continue;
          }

          // explicit is on and property isn't in the frame, skip processing
          if(flags.explicit && !(prop in frame)) {
            continue;
          }

          // add objects
          for(const o of subject[prop]) {
            const subframe = (prop in frame ?
              frame[prop] : _createImplicitFrame(flags));

            // recurse into list
            if(graphTypes.isList(o)) {
              const subframe =
                (frame[prop] && frame[prop][0] && frame[prop][0]['@list']) ?
                  frame[prop][0]['@list'] :
                  _createImplicitFrame(flags);

              // add empty list
              const list = {'@list': []};
              _addFrameOutput(output, prop, list);

              // add list objects
              const src = o['@list'];
              for(const oo of src) {
                if(graphTypes.isSubjectReference(oo)) {
                  // recurse into subject reference
                  api$1.frame(
                    {...state, embedded: true},
                    [oo['@id']], subframe, list, '@list');
                } else {
                  // include other values automatically
                  _addFrameOutput(list, '@list', util.clone(oo));
                }
              }
            } else if(graphTypes.isSubjectReference(o)) {
              // recurse into subject reference
              api$1.frame(
                {...state, embedded: true},
                [o['@id']], subframe, output, prop);
            } else if(_valueMatch(subframe[0], o)) {
              // include other values, if they match
              _addFrameOutput(output, prop, util.clone(o));
            }
          }
        }

        // handle defaults
        for(const prop of Object.keys(frame).sort()) {
          // skip keywords
          if(prop === '@type') {
            if(!types.isObject(frame[prop][0]) ||
               !('@default' in frame[prop][0])) {
              continue;
            }
            // allow through default types
          } else if(isKeyword(prop)) {
            continue;
          }

          // if omit default is off, then include default values for properties
          // that appear in the next frame but are not in the matching subject
          const next = frame[prop][0] || {};
          const omitDefaultOn = _getFrameFlag(next, options, 'omitDefault');
          if(!omitDefaultOn && !(prop in output)) {
            let preserve = '@null';
            if('@default' in next) {
              preserve = util.clone(next['@default']);
            }
            if(!types.isArray(preserve)) {
              preserve = [preserve];
            }
            output[prop] = [{'@preserve': preserve}];
          }
        }

        // if embed reverse values by finding nodes having this subject as a value
        // of the associated property
        for(const reverseProp of Object.keys(frame['@reverse'] || {}).sort()) {
          const subframe = frame['@reverse'][reverseProp];
          for(const subject of Object.keys(state.subjects)) {
            const nodeValues =
              util.getValues(state.subjects[subject], reverseProp);
            if(nodeValues.some(v => v['@id'] === id)) {
              // node has property referencing this subject, recurse
              output['@reverse'] = output['@reverse'] || {};
              util.addValue(
                output['@reverse'], reverseProp, [], {propertyIsArray: true});
              api$1.frame(
                {...state, embedded: true},
                [subject], subframe, output['@reverse'][reverseProp],
                property);
            }
          }
        }

        // add output to parent
        _addFrameOutput(parent, property, output);

        // pop matching subject from circular ref-checking stack
        state.subjectStack.pop();
      }
    };

    /**
     * Replace `@null` with `null`, removing it from arrays.
     *
     * @param input the framed, compacted output.
     * @param options the framing options used.
     *
     * @return the resulting output.
     */
    api$1.cleanupNull = (input, options) => {
      // recurse through arrays
      if(types.isArray(input)) {
        const noNulls = input.map(v => api$1.cleanupNull(v, options));
        return noNulls.filter(v => v); // removes nulls from array
      }

      if(input === '@null') {
        return null;
      }

      if(types.isObject(input)) {
        // handle in-memory linked nodes
        if('@id' in input) {
          const id = input['@id'];
          if(options.link.hasOwnProperty(id)) {
            const idx = options.link[id].indexOf(input);
            if(idx !== -1) {
              // already visited
              return options.link[id][idx];
            }
            // prevent circular visitation
            options.link[id].push(input);
          } else {
            // prevent circular visitation
            options.link[id] = [input];
          }
        }

        for(const key in input) {
          input[key] = api$1.cleanupNull(input[key], options);
        }
      }
      return input;
    };

    /**
     * Creates an implicit frame when recursing through subject matches. If
     * a frame doesn't have an explicit frame for a particular property, then
     * a wildcard child frame will be created that uses the same flags that the
     * parent frame used.
     *
     * @param flags the current framing flags.
     *
     * @return the implicit frame.
     */
    function _createImplicitFrame(flags) {
      const frame = {};
      for(const key in flags) {
        if(flags[key] !== undefined) {
          frame['@' + key] = [flags[key]];
        }
      }
      return [frame];
    }

    /**
     * Checks the current subject stack to see if embedding the given subject
     * would cause a circular reference.
     *
     * @param subjectToEmbed the subject to embed.
     * @param graph the graph the subject to embed is in.
     * @param subjectStack the current stack of subjects.
     *
     * @return true if a circular reference would be created, false if not.
     */
    function _createsCircularReference(subjectToEmbed, graph, subjectStack) {
      for(let i = subjectStack.length - 1; i >= 0; --i) {
        const subject = subjectStack[i];
        if(subject.graph === graph &&
          subject.subject['@id'] === subjectToEmbed['@id']) {
          return true;
        }
      }
      return false;
    }

    /**
     * Gets the frame flag value for the given flag name.
     *
     * @param frame the frame.
     * @param options the framing options.
     * @param name the flag name.
     *
     * @return the flag value.
     */
    function _getFrameFlag(frame, options, name) {
      const flag = '@' + name;
      let rval = (flag in frame ? frame[flag][0] : options[name]);
      if(name === 'embed') {
        // default is "@last"
        // backwards-compatibility support for "embed" maps:
        // true => "@last"
        // false => "@never"
        if(rval === true) {
          rval = '@once';
        } else if(rval === false) {
          rval = '@never';
        } else if(rval !== '@always' && rval !== '@never' && rval !== '@link' &&
          rval !== '@first' && rval !== '@last' && rval !== '@once') {
          throw new JsonLdError_1(
            'Invalid JSON-LD syntax; invalid value of @embed.',
            'jsonld.SyntaxError', {code: 'invalid @embed value', frame});
        }
      }
      return rval;
    }

    /**
     * Validates a JSON-LD frame, throwing an exception if the frame is invalid.
     *
     * @param frame the frame to validate.
     */
    function _validateFrame(frame) {
      if(!types.isArray(frame) || frame.length !== 1 || !types.isObject(frame[0])) {
        throw new JsonLdError_1(
          'Invalid JSON-LD syntax; a JSON-LD frame must be a single object.',
          'jsonld.SyntaxError', {frame});
      }

      if('@id' in frame[0]) {
        for(const id of util.asArray(frame[0]['@id'])) {
          // @id must be wildcard or an IRI
          if(!(types.isObject(id) || url.isAbsolute(id)) ||
            (types.isString(id) && id.indexOf('_:') === 0)) {
            throw new JsonLdError_1(
              'Invalid JSON-LD syntax; invalid @id in frame.',
              'jsonld.SyntaxError', {code: 'invalid frame', frame});
          }
        }
      }

      if('@type' in frame[0]) {
        for(const type of util.asArray(frame[0]['@type'])) {
          // @id must be wildcard or an IRI
          if(!(types.isObject(type) || url.isAbsolute(type)) ||
            (types.isString(type) && type.indexOf('_:') === 0)) {
            throw new JsonLdError_1(
              'Invalid JSON-LD syntax; invalid @type in frame.',
              'jsonld.SyntaxError', {code: 'invalid frame', frame});
          }
        }
      }
    }

    /**
     * Returns a map of all of the subjects that match a parsed frame.
     *
     * @param state the current framing state.
     * @param subjects the set of subjects to filter.
     * @param frame the parsed frame.
     * @param flags the frame flags.
     *
     * @return all of the matched subjects.
     */
    function _filterSubjects(state, subjects, frame, flags) {
      // filter subjects in @id order
      const rval = {};
      for(const id of subjects) {
        const subject = state.graphMap[state.graph][id];
        if(_filterSubject(state, subject, frame, flags)) {
          rval[id] = subject;
        }
      }
      return rval;
    }

    /**
     * Returns true if the given subject matches the given frame.
     *
     * Matches either based on explicit type inclusion where the node has any
     * type listed in the frame. If the frame has empty types defined matches
     * nodes not having a @type. If the frame has a type of {} defined matches
     * nodes having any type defined.
     *
     * Otherwise, does duck typing, where the node must have all of the
     * properties defined in the frame.
     *
     * @param state the current framing state.
     * @param subject the subject to check.
     * @param frame the frame to check.
     * @param flags the frame flags.
     *
     * @return true if the subject matches, false if not.
     */
    function _filterSubject(state, subject, frame, flags) {
      // check ducktype
      let wildcard = true;
      let matchesSome = false;

      for(const key in frame) {
        let matchThis = false;
        const nodeValues = util.getValues(subject, key);
        const isEmpty = util.getValues(frame, key).length === 0;

        if(key === '@id') {
          // match on no @id or any matching @id, including wildcard
          if(types.isEmptyObject(frame['@id'][0] || {})) {
            matchThis = true;
          } else if(frame['@id'].length >= 0) {
            matchThis = frame['@id'].includes(nodeValues[0]);
          }
          if(!flags.requireAll) {
            return matchThis;
          }
        } else if(key === '@type') {
          // check @type (object value means 'any' type,
          // fall through to ducktyping)
          wildcard = false;
          if(isEmpty) {
            if(nodeValues.length > 0) {
              // don't match on no @type
              return false;
            }
            matchThis = true;
          } else if(frame['@type'].length === 1 &&
            types.isEmptyObject(frame['@type'][0])) {
            // match on wildcard @type if there is a type
            matchThis = nodeValues.length > 0;
          } else {
            // match on a specific @type
            for(const type of frame['@type']) {
              if(types.isObject(type) && '@default' in type) {
                // match on default object
                matchThis = true;
              } else {
                matchThis = matchThis || nodeValues.some(tt => tt === type);
              }
            }
          }
          if(!flags.requireAll) {
            return matchThis;
          }
        } else if(isKeyword(key)) {
          continue;
        } else {
          // Force a copy of this frame entry so it can be manipulated
          const thisFrame = util.getValues(frame, key)[0];
          let hasDefault = false;
          if(thisFrame) {
            _validateFrame([thisFrame]);
            hasDefault = '@default' in thisFrame;
          }

          // no longer a wildcard pattern if frame has any non-keyword properties
          wildcard = false;

          // skip, but allow match if node has no value for property, and frame has
          // a default value
          if(nodeValues.length === 0 && hasDefault) {
            continue;
          }

          // if frame value is empty, don't match if subject has any value
          if(nodeValues.length > 0 && isEmpty) {
            return false;
          }

          if(thisFrame === undefined) {
            // node does not match if values is not empty and the value of property
            // in frame is match none.
            if(nodeValues.length > 0) {
              return false;
            }
            matchThis = true;
          } else {
            if(graphTypes.isList(thisFrame)) {
              const listValue = thisFrame['@list'][0];
              if(graphTypes.isList(nodeValues[0])) {
                const nodeListValues = nodeValues[0]['@list'];

                if(graphTypes.isValue(listValue)) {
                  // match on any matching value
                  matchThis = nodeListValues.some(lv => _valueMatch(listValue, lv));
                } else if(graphTypes.isSubject(listValue) ||
                  graphTypes.isSubjectReference(listValue)) {
                  matchThis = nodeListValues.some(lv => _nodeMatch(
                    state, listValue, lv, flags));
                }
              }
            } else if(graphTypes.isValue(thisFrame)) {
              matchThis = nodeValues.some(nv => _valueMatch(thisFrame, nv));
            } else if(graphTypes.isSubjectReference(thisFrame)) {
              matchThis =
                nodeValues.some(nv => _nodeMatch(state, thisFrame, nv, flags));
            } else if(types.isObject(thisFrame)) {
              matchThis = nodeValues.length > 0;
            } else {
              matchThis = false;
            }
          }
        }

        // all non-defaulted values must match if requireAll is set
        if(!matchThis && flags.requireAll) {
          return false;
        }

        matchesSome = matchesSome || matchThis;
      }

      // return true if wildcard or subject matches some properties
      return wildcard || matchesSome;
    }

    /**
     * Removes an existing embed.
     *
     * @param state the current framing state.
     * @param id the @id of the embed to remove.
     */
    function _removeEmbed(state, id) {
      // get existing embed
      const embeds = state.uniqueEmbeds[state.graph];
      const embed = embeds[id];
      const parent = embed.parent;
      const property = embed.property;

      // create reference to replace embed
      const subject = {'@id': id};

      // remove existing embed
      if(types.isArray(parent)) {
        // replace subject with reference
        for(let i = 0; i < parent.length; ++i) {
          if(util.compareValues(parent[i], subject)) {
            parent[i] = subject;
            break;
          }
        }
      } else {
        // replace subject with reference
        const useArray = types.isArray(parent[property]);
        util.removeValue(parent, property, subject, {propertyIsArray: useArray});
        util.addValue(parent, property, subject, {propertyIsArray: useArray});
      }

      // recursively remove dependent dangling embeds
      const removeDependents = id => {
        // get embed keys as a separate array to enable deleting keys in map
        const ids = Object.keys(embeds);
        for(const next of ids) {
          if(next in embeds && types.isObject(embeds[next].parent) &&
            embeds[next].parent['@id'] === id) {
            delete embeds[next];
            removeDependents(next);
          }
        }
      };
      removeDependents(id);
    }

    /**
     * Removes the @preserve keywords from expanded result of framing.
     *
     * @param input the framed, framed output.
     * @param options the framing options used.
     *
     * @return the resulting output.
     */
    function _cleanupPreserve(input, options) {
      // recurse through arrays
      if(types.isArray(input)) {
        return input.map(value => _cleanupPreserve(value, options));
      }

      if(types.isObject(input)) {
        // remove @preserve
        if('@preserve' in input) {
          return input['@preserve'][0];
        }

        // skip @values
        if(graphTypes.isValue(input)) {
          return input;
        }

        // recurse through @lists
        if(graphTypes.isList(input)) {
          input['@list'] = _cleanupPreserve(input['@list'], options);
          return input;
        }

        // handle in-memory linked nodes
        if('@id' in input) {
          const id = input['@id'];
          if(options.link.hasOwnProperty(id)) {
            const idx = options.link[id].indexOf(input);
            if(idx !== -1) {
              // already visited
              return options.link[id][idx];
            }
            // prevent circular visitation
            options.link[id].push(input);
          } else {
            // prevent circular visitation
            options.link[id] = [input];
          }
        }

        // recurse through properties
        for(const prop in input) {
          // potentially remove the id, if it is an unreference bnode
          if(prop === '@id' && options.bnodesToClear.includes(input[prop])) {
            delete input['@id'];
            continue;
          }

          input[prop] = _cleanupPreserve(input[prop], options);
        }
      }
      return input;
    }

    /**
     * Adds framing output to the given parent.
     *
     * @param parent the parent to add to.
     * @param property the parent property.
     * @param output the output to add.
     */
    function _addFrameOutput(parent, property, output) {
      if(types.isObject(parent)) {
        util.addValue(parent, property, output, {propertyIsArray: true});
      } else {
        parent.push(output);
      }
    }

    /**
     * Node matches if it is a node, and matches the pattern as a frame.
     *
     * @param state the current framing state.
     * @param pattern used to match value
     * @param value to check
     * @param flags the frame flags.
     */
    function _nodeMatch(state, pattern, value, flags) {
      if(!('@id' in value)) {
        return false;
      }
      const nodeObject = state.subjects[value['@id']];
      return nodeObject && _filterSubject(state, nodeObject, pattern, flags);
    }

    /**
     * Value matches if it is a value and matches the value pattern
     *
     * * `pattern` is empty
     * * @values are the same, or `pattern[@value]` is a wildcard, and
     * * @types are the same or `value[@type]` is not null
     *   and `pattern[@type]` is `{}`, or `value[@type]` is null
     *   and `pattern[@type]` is null or `[]`, and
     * * @languages are the same or `value[@language]` is not null
     *   and `pattern[@language]` is `{}`, or `value[@language]` is null
     *   and `pattern[@language]` is null or `[]`.
     *
     * @param pattern used to match value
     * @param value to check
     */
    function _valueMatch(pattern, value) {
      const v1 = value['@value'];
      const t1 = value['@type'];
      const l1 = value['@language'];
      const v2 = pattern['@value'] ?
        (types.isArray(pattern['@value']) ?
          pattern['@value'] : [pattern['@value']]) :
        [];
      const t2 = pattern['@type'] ?
        (types.isArray(pattern['@type']) ?
          pattern['@type'] : [pattern['@type']]) :
        [];
      const l2 = pattern['@language'] ?
        (types.isArray(pattern['@language']) ?
          pattern['@language'] : [pattern['@language']]) :
        [];

      if(v2.length === 0 && t2.length === 0 && l2.length === 0) {
        return true;
      }
      if(!(v2.includes(v1) || types.isEmptyObject(v2[0]))) {
        return false;
      }
      if(!(!t1 && t2.length === 0 || t2.includes(t1) || t1 &&
        types.isEmptyObject(t2[0]))) {
        return false;
      }
      if(!(!l1 && l2.length === 0 || l2.includes(l1) || l1 &&
        types.isEmptyObject(l2[0]))) {
        return false;
      }
      return true;
    }

    /*
     * Copyright (c) 2017 Digital Bazaar, Inc. All rights reserved.
     */



    const {
      isArray: _isArray$1,
      isObject: _isObject$1,
      isString: _isString$1,
      isUndefined: _isUndefined
    } = types;

    const {
      isList: _isList,
      isValue: _isValue,
      isGraph: _isGraph,
      isSimpleGraph: _isSimpleGraph,
      isSubjectReference: _isSubjectReference$1
    } = graphTypes;

    const {
      expandIri: _expandIri$1,
      getContextValue: _getContextValue,
      isKeyword: _isKeyword,
      process: _processContext$1,
      processingMode: _processingMode$1
    } = context;

    const {
      removeBase: _removeBase,
      prependBase: _prependBase
    } = url;

    const {
      addValue: _addValue,
      asArray: _asArray,
      compareShortestLeast: _compareShortestLeast
    } = util;

    const api = {};
    var compact = api;

    /**
     * Recursively compacts an element using the given active context. All values
     * must be in expanded form before this method is called.
     *
     * @param activeCtx the active context to use.
     * @param activeProperty the compacted property associated with the element
     *          to compact, null for none.
     * @param element the element to compact.
     * @param options the compaction options.
     * @param compactionMap the compaction map to use.
     *
     * @return a promise that resolves to the compacted value.
     */
    api.compact = async ({
      activeCtx,
      activeProperty = null,
      element,
      options = {},
      compactionMap = () => undefined
    }) => {
      // recursively compact array
      if(_isArray$1(element)) {
        let rval = [];
        for(let i = 0; i < element.length; ++i) {
          // compact, dropping any null values unless custom mapped
          let compacted = await api.compact({
            activeCtx,
            activeProperty,
            element: element[i],
            options,
            compactionMap
          });
          if(compacted === null) {
            compacted = await compactionMap({
              unmappedValue: element[i],
              activeCtx,
              activeProperty,
              parent: element,
              index: i,
              options
            });
            if(compacted === undefined) {
              continue;
            }
          }
          rval.push(compacted);
        }
        if(options.compactArrays && rval.length === 1) {
          // use single element if no container is specified
          const container = _getContextValue(
            activeCtx, activeProperty, '@container') || [];
          if(container.length === 0) {
            rval = rval[0];
          }
        }
        return rval;
      }

      // use any scoped context on activeProperty
      const ctx = _getContextValue(activeCtx, activeProperty, '@context');
      if(!_isUndefined(ctx)) {
        activeCtx = await _processContext$1({
          activeCtx,
          localCtx: ctx,
          propagate: true,
          overrideProtected: true,
          options
        });
      }

      // recursively compact object
      if(_isObject$1(element)) {
        if(options.link && '@id' in element &&
          options.link.hasOwnProperty(element['@id'])) {
          // check for a linked element to reuse
          const linked = options.link[element['@id']];
          for(let i = 0; i < linked.length; ++i) {
            if(linked[i].expanded === element) {
              return linked[i].compacted;
            }
          }
        }

        // do value compaction on @values and subject references
        if(_isValue(element) || _isSubjectReference$1(element)) {
          const rval =
            api.compactValue({activeCtx, activeProperty, value: element, options});
          if(options.link && _isSubjectReference$1(element)) {
            // store linked element
            if(!(options.link.hasOwnProperty(element['@id']))) {
              options.link[element['@id']] = [];
            }
            options.link[element['@id']].push({expanded: element, compacted: rval});
          }
          return rval;
        }

        // if expanded property is @list and we're contained within a list
        // container, recursively compact this item to an array
        if(_isList(element)) {
          const container = _getContextValue(
            activeCtx, activeProperty, '@container') || [];
          if(container.includes('@list')) {
            return api.compact({
              activeCtx,
              activeProperty,
              element: element['@list'],
              options,
              compactionMap
            });
          }
        }

        // FIXME: avoid misuse of active property as an expanded property?
        const insideReverse = (activeProperty === '@reverse');

        const rval = {};

        // original context before applying property-scoped and local contexts
        const inputCtx = activeCtx;

        // revert to previous context, if there is one,
        // and element is not a value object or a node reference
        if(!_isValue(element) && !_isSubjectReference$1(element)) {
          activeCtx = activeCtx.revertToPreviousContext();
        }

        // apply property-scoped context after reverting term-scoped context
        const propertyScopedCtx =
          _getContextValue(inputCtx, activeProperty, '@context');
        if(!_isUndefined(propertyScopedCtx)) {
          activeCtx = await _processContext$1({
            activeCtx,
            localCtx: propertyScopedCtx,
            propagate: true,
            overrideProtected: true,
            options
          });
        }

        if(options.link && '@id' in element) {
          // store linked element
          if(!options.link.hasOwnProperty(element['@id'])) {
            options.link[element['@id']] = [];
          }
          options.link[element['@id']].push({expanded: element, compacted: rval});
        }

        // apply any context defined on an alias of @type
        // if key is @type and any compacted value is a term having a local
        // context, overlay that context
        let types = element['@type'] || [];
        if(types.length > 1) {
          types = Array.from(types).sort();
        }
        // find all type-scoped contexts based on current context, prior to
        // updating it
        const typeContext = activeCtx;
        for(const type of types) {
          const compactedType = api.compactIri(
            {activeCtx: typeContext, iri: type, relativeTo: {vocab: true}});

          // Use any type-scoped context defined on this value
          const ctx = _getContextValue(inputCtx, compactedType, '@context');
          if(!_isUndefined(ctx)) {
            activeCtx = await _processContext$1({
              activeCtx,
              localCtx: ctx,
              options,
              propagate: false
            });
          }
        }

        // process element keys in order
        const keys = Object.keys(element).sort();
        for(const expandedProperty of keys) {
          const expandedValue = element[expandedProperty];

          // compact @id
          if(expandedProperty === '@id') {
            let compactedValue = _asArray(expandedValue).map(
              expandedIri => api.compactIri({
                activeCtx,
                iri: expandedIri,
                relativeTo: {vocab: false},
                base: options.base
              }));
            if(compactedValue.length === 1) {
              compactedValue = compactedValue[0];
            }

            // use keyword alias and add value
            const alias = api.compactIri(
              {activeCtx, iri: '@id', relativeTo: {vocab: true}});

            rval[alias] = compactedValue;
            continue;
          }

          // compact @type(s)
          if(expandedProperty === '@type') {
            // resolve type values against previous context
            let compactedValue = _asArray(expandedValue).map(
              expandedIri => api.compactIri({
                activeCtx: inputCtx,
                iri: expandedIri,
                relativeTo: {vocab: true}
              }));
            if(compactedValue.length === 1) {
              compactedValue = compactedValue[0];
            }

            // use keyword alias and add value
            const alias = api.compactIri(
              {activeCtx, iri: '@type', relativeTo: {vocab: true}});
            const container = _getContextValue(
              activeCtx, alias, '@container') || [];

            // treat as array for @type if @container includes @set
            const typeAsSet =
              container.includes('@set') &&
              _processingMode$1(activeCtx, 1.1);
            const isArray =
              typeAsSet || (_isArray$1(compactedValue) && expandedValue.length === 0);
            _addValue(rval, alias, compactedValue, {propertyIsArray: isArray});
            continue;
          }

          // handle @reverse
          if(expandedProperty === '@reverse') {
            // recursively compact expanded value
            const compactedValue = await api.compact({
              activeCtx,
              activeProperty: '@reverse',
              element: expandedValue,
              options,
              compactionMap
            });

            // handle double-reversed properties
            for(const compactedProperty in compactedValue) {
              if(activeCtx.mappings.has(compactedProperty) &&
                activeCtx.mappings.get(compactedProperty).reverse) {
                const value = compactedValue[compactedProperty];
                const container = _getContextValue(
                  activeCtx, compactedProperty, '@container') || [];
                const useArray = (
                  container.includes('@set') || !options.compactArrays);
                _addValue(
                  rval, compactedProperty, value, {propertyIsArray: useArray});
                delete compactedValue[compactedProperty];
              }
            }

            if(Object.keys(compactedValue).length > 0) {
              // use keyword alias and add value
              const alias = api.compactIri({
                activeCtx,
                iri: expandedProperty,
                relativeTo: {vocab: true}
              });
              _addValue(rval, alias, compactedValue);
            }

            continue;
          }

          if(expandedProperty === '@preserve') {
            // compact using activeProperty
            const compactedValue = await api.compact({
              activeCtx,
              activeProperty,
              element: expandedValue,
              options,
              compactionMap
            });

            if(!(_isArray$1(compactedValue) && compactedValue.length === 0)) {
              _addValue(rval, expandedProperty, compactedValue);
            }
            continue;
          }

          // handle @index property
          if(expandedProperty === '@index') {
            // drop @index if inside an @index container
            const container = _getContextValue(
              activeCtx, activeProperty, '@container') || [];
            if(container.includes('@index')) {
              continue;
            }

            // use keyword alias and add value
            const alias = api.compactIri({
              activeCtx,
              iri: expandedProperty,
              relativeTo: {vocab: true}
            });
            _addValue(rval, alias, expandedValue);
            continue;
          }

          // skip array processing for keywords that aren't
          // @graph, @list, or @included
          if(expandedProperty !== '@graph' && expandedProperty !== '@list' &&
            expandedProperty !== '@included' &&
            _isKeyword(expandedProperty)) {
            // use keyword alias and add value as is
            const alias = api.compactIri({
              activeCtx,
              iri: expandedProperty,
              relativeTo: {vocab: true}
            });
            _addValue(rval, alias, expandedValue);
            continue;
          }

          // Note: expanded value must be an array due to expansion algorithm.
          if(!_isArray$1(expandedValue)) {
            throw new JsonLdError_1(
              'JSON-LD expansion error; expanded value must be an array.',
              'jsonld.SyntaxError');
          }

          // preserve empty arrays
          if(expandedValue.length === 0) {
            const itemActiveProperty = api.compactIri({
              activeCtx,
              iri: expandedProperty,
              value: expandedValue,
              relativeTo: {vocab: true},
              reverse: insideReverse
            });
            const nestProperty = activeCtx.mappings.has(itemActiveProperty) ?
              activeCtx.mappings.get(itemActiveProperty)['@nest'] : null;
            let nestResult = rval;
            if(nestProperty) {
              _checkNestProperty(activeCtx, nestProperty, options);
              if(!_isObject$1(rval[nestProperty])) {
                rval[nestProperty] = {};
              }
              nestResult = rval[nestProperty];
            }
            _addValue(
              nestResult, itemActiveProperty, expandedValue, {
                propertyIsArray: true
              });
          }

          // recusively process array values
          for(const expandedItem of expandedValue) {
            // compact property and get container type
            const itemActiveProperty = api.compactIri({
              activeCtx,
              iri: expandedProperty,
              value: expandedItem,
              relativeTo: {vocab: true},
              reverse: insideReverse
            });

            // if itemActiveProperty is a @nest property, add values to nestResult,
            // otherwise rval
            const nestProperty = activeCtx.mappings.has(itemActiveProperty) ?
              activeCtx.mappings.get(itemActiveProperty)['@nest'] : null;
            let nestResult = rval;
            if(nestProperty) {
              _checkNestProperty(activeCtx, nestProperty, options);
              if(!_isObject$1(rval[nestProperty])) {
                rval[nestProperty] = {};
              }
              nestResult = rval[nestProperty];
            }

            const container = _getContextValue(
              activeCtx, itemActiveProperty, '@container') || [];

            // get simple @graph or @list value if appropriate
            const isGraph = _isGraph(expandedItem);
            const isList = _isList(expandedItem);
            let inner;
            if(isList) {
              inner = expandedItem['@list'];
            } else if(isGraph) {
              inner = expandedItem['@graph'];
            }

            // recursively compact expanded item
            let compactedItem = await api.compact({
              activeCtx,
              activeProperty: itemActiveProperty,
              element: (isList || isGraph) ? inner : expandedItem,
              options,
              compactionMap
            });

            // handle @list
            if(isList) {
              // ensure @list value is an array
              if(!_isArray$1(compactedItem)) {
                compactedItem = [compactedItem];
              }

              if(!container.includes('@list')) {
                // wrap using @list alias
                compactedItem = {
                  [api.compactIri({
                    activeCtx,
                    iri: '@list',
                    relativeTo: {vocab: true}
                  })]: compactedItem
                };

                // include @index from expanded @list, if any
                if('@index' in expandedItem) {
                  compactedItem[api.compactIri({
                    activeCtx,
                    iri: '@index',
                    relativeTo: {vocab: true}
                  })] = expandedItem['@index'];
                }
              } else {
                _addValue(nestResult, itemActiveProperty, compactedItem, {
                  valueIsArray: true,
                  allowDuplicate: true
                });
                continue;
              }
            }

            // Graph object compaction cases
            if(isGraph) {
              if(container.includes('@graph') && (container.includes('@id') ||
                container.includes('@index') && _isSimpleGraph(expandedItem))) {
                // get or create the map object
                let mapObject;
                if(nestResult.hasOwnProperty(itemActiveProperty)) {
                  mapObject = nestResult[itemActiveProperty];
                } else {
                  nestResult[itemActiveProperty] = mapObject = {};
                }

                // index on @id or @index or alias of @none
                const key = (container.includes('@id') ?
                  expandedItem['@id'] : expandedItem['@index']) ||
                  api.compactIri({activeCtx, iri: '@none',
                    relativeTo: {vocab: true}});
                // add compactedItem to map, using value of `@id` or a new blank
                // node identifier

                _addValue(
                  mapObject, key, compactedItem, {
                    propertyIsArray:
                      (!options.compactArrays || container.includes('@set'))
                  });
              } else if(container.includes('@graph') &&
                _isSimpleGraph(expandedItem)) {
                // container includes @graph but not @id or @index and value is a
                // simple graph object add compact value
                // if compactedItem contains multiple values, it is wrapped in
                // `@included`
                if(_isArray$1(compactedItem) && compactedItem.length > 1) {
                  compactedItem = {'@included': compactedItem};
                }
                _addValue(
                  nestResult, itemActiveProperty, compactedItem, {
                    propertyIsArray:
                      (!options.compactArrays || container.includes('@set'))
                  });
              } else {
                // wrap using @graph alias, remove array if only one item and
                // compactArrays not set
                if(_isArray$1(compactedItem) && compactedItem.length === 1 &&
                  options.compactArrays) {
                  compactedItem = compactedItem[0];
                }
                compactedItem = {
                  [api.compactIri({
                    activeCtx,
                    iri: '@graph',
                    relativeTo: {vocab: true}
                  })]: compactedItem
                };

                // include @id from expanded graph, if any
                if('@id' in expandedItem) {
                  compactedItem[api.compactIri({
                    activeCtx,
                    iri: '@id',
                    relativeTo: {vocab: true}
                  })] = expandedItem['@id'];
                }

                // include @index from expanded graph, if any
                if('@index' in expandedItem) {
                  compactedItem[api.compactIri({
                    activeCtx,
                    iri: '@index',
                    relativeTo: {vocab: true}
                  })] = expandedItem['@index'];
                }
                _addValue(
                  nestResult, itemActiveProperty, compactedItem, {
                    propertyIsArray:
                      (!options.compactArrays || container.includes('@set'))
                  });
              }
            } else if(container.includes('@language') ||
              container.includes('@index') || container.includes('@id') ||
              container.includes('@type')) {
              // handle language and index maps
              // get or create the map object
              let mapObject;
              if(nestResult.hasOwnProperty(itemActiveProperty)) {
                mapObject = nestResult[itemActiveProperty];
              } else {
                nestResult[itemActiveProperty] = mapObject = {};
              }

              let key;
              if(container.includes('@language')) {
              // if container is a language map, simplify compacted value to
              // a simple string
                if(_isValue(compactedItem)) {
                  compactedItem = compactedItem['@value'];
                }
                key = expandedItem['@language'];
              } else if(container.includes('@index')) {
                const indexKey = _getContextValue(
                  activeCtx, itemActiveProperty, '@index') || '@index';
                const containerKey = api.compactIri(
                  {activeCtx, iri: indexKey, relativeTo: {vocab: true}});
                if(indexKey === '@index') {
                  key = expandedItem['@index'];
                  delete compactedItem[containerKey];
                } else {
                  let others;
                  [key, ...others] = _asArray(compactedItem[indexKey] || []);
                  if(!_isString$1(key)) {
                    // Will use @none if it isn't a string.
                    key = null;
                  } else {
                    switch(others.length) {
                      case 0:
                        delete compactedItem[indexKey];
                        break;
                      case 1:
                        compactedItem[indexKey] = others[0];
                        break;
                      default:
                        compactedItem[indexKey] = others;
                        break;
                    }
                  }
                }
              } else if(container.includes('@id')) {
                const idKey = api.compactIri({activeCtx, iri: '@id',
                  relativeTo: {vocab: true}});
                key = compactedItem[idKey];
                delete compactedItem[idKey];
              } else if(container.includes('@type')) {
                const typeKey = api.compactIri({
                  activeCtx,
                  iri: '@type',
                  relativeTo: {vocab: true}
                });
                let types;
                [key, ...types] = _asArray(compactedItem[typeKey] || []);
                switch(types.length) {
                  case 0:
                    delete compactedItem[typeKey];
                    break;
                  case 1:
                    compactedItem[typeKey] = types[0];
                    break;
                  default:
                    compactedItem[typeKey] = types;
                    break;
                }

                // If compactedItem contains a single entry
                // whose key maps to @id, recompact without @type
                if(Object.keys(compactedItem).length === 1 &&
                  '@id' in expandedItem) {
                  compactedItem = await api.compact({
                    activeCtx,
                    activeProperty: itemActiveProperty,
                    element: {'@id': expandedItem['@id']},
                    options,
                    compactionMap
                  });
                }
              }

              // if compacting this value which has no key, index on @none
              if(!key) {
                key = api.compactIri({activeCtx, iri: '@none',
                  relativeTo: {vocab: true}});
              }
              // add compact value to map object using key from expanded value
              // based on the container type
              _addValue(
                mapObject, key, compactedItem, {
                  propertyIsArray: container.includes('@set')
                });
            } else {
              // use an array if: compactArrays flag is false,
              // @container is @set or @list , value is an empty
              // array, or key is @graph
              const isArray = (!options.compactArrays ||
                container.includes('@set') || container.includes('@list') ||
                (_isArray$1(compactedItem) && compactedItem.length === 0) ||
                expandedProperty === '@list' || expandedProperty === '@graph');

              // add compact value
              _addValue(
                nestResult, itemActiveProperty, compactedItem,
                {propertyIsArray: isArray});
            }
          }
        }

        return rval;
      }

      // only primitives remain which are already compact
      return element;
    };

    /**
     * Compacts an IRI or keyword into a term or prefix if it can be. If the
     * IRI has an associated value it may be passed.
     *
     * @param activeCtx the active context to use.
     * @param iri the IRI to compact.
     * @param value the value to check or null.
     * @param relativeTo options for how to compact IRIs:
     *          vocab: true to split after @vocab, false not to.
     * @param reverse true if a reverse property is being compacted, false if not.
     * @param base the absolute URL to use for compacting document-relative IRIs.
     *
     * @return the compacted term, prefix, keyword alias, or the original IRI.
     */
    api.compactIri = ({
      activeCtx,
      iri,
      value = null,
      relativeTo = {vocab: false},
      reverse = false,
      base = null
    }) => {
      // can't compact null
      if(iri === null) {
        return iri;
      }

      // if context is from a property term scoped context composed with a
      // type-scoped context, then use the previous context instead
      if(activeCtx.isPropertyTermScoped && activeCtx.previousContext) {
        activeCtx = activeCtx.previousContext;
      }

      const inverseCtx = activeCtx.getInverse();

      // if term is a keyword, it may be compacted to a simple alias
      if(_isKeyword(iri) &&
        iri in inverseCtx &&
        '@none' in inverseCtx[iri] &&
        '@type' in inverseCtx[iri]['@none'] &&
        '@none' in inverseCtx[iri]['@none']['@type']) {
        return inverseCtx[iri]['@none']['@type']['@none'];
      }

      // use inverse context to pick a term if iri is relative to vocab
      if(relativeTo.vocab && iri in inverseCtx) {
        const defaultLanguage = activeCtx['@language'] || '@none';

        // prefer @index if available in value
        const containers = [];
        if(_isObject$1(value) && '@index' in value && !('@graph' in value)) {
          containers.push('@index', '@index@set');
        }

        // if value is a preserve object, use its value
        if(_isObject$1(value) && '@preserve' in value) {
          value = value['@preserve'][0];
        }

        // prefer most specific container including @graph, prefering @set
        // variations
        if(_isGraph(value)) {
          // favor indexmap if the graph is indexed
          if('@index' in value) {
            containers.push(
              '@graph@index', '@graph@index@set', '@index', '@index@set');
          }
          // favor idmap if the graph is has an @id
          if('@id' in value) {
            containers.push(
              '@graph@id', '@graph@id@set');
          }
          containers.push('@graph', '@graph@set', '@set');
          // allow indexmap if the graph is not indexed
          if(!('@index' in value)) {
            containers.push(
              '@graph@index', '@graph@index@set', '@index', '@index@set');
          }
          // allow idmap if the graph does not have an @id
          if(!('@id' in value)) {
            containers.push('@graph@id', '@graph@id@set');
          }
        } else if(_isObject$1(value) && !_isValue(value)) {
          containers.push('@id', '@id@set', '@type', '@set@type');
        }

        // defaults for term selection based on type/language
        let typeOrLanguage = '@language';
        let typeOrLanguageValue = '@null';

        if(reverse) {
          typeOrLanguage = '@type';
          typeOrLanguageValue = '@reverse';
          containers.push('@set');
        } else if(_isList(value)) {
          // choose the most specific term that works for all elements in @list
          // only select @list containers if @index is NOT in value
          if(!('@index' in value)) {
            containers.push('@list');
          }
          const list = value['@list'];
          if(list.length === 0) {
            // any empty list can be matched against any term that uses the
            // @list container regardless of @type or @language
            typeOrLanguage = '@any';
            typeOrLanguageValue = '@none';
          } else {
            let commonLanguage = (list.length === 0) ? defaultLanguage : null;
            let commonType = null;
            for(let i = 0; i < list.length; ++i) {
              const item = list[i];
              let itemLanguage = '@none';
              let itemType = '@none';
              if(_isValue(item)) {
                if('@direction' in item) {
                  const lang = (item['@language'] || '').toLowerCase();
                  const dir = item['@direction'];
                  itemLanguage = `${lang}_${dir}`;
                } else if('@language' in item) {
                  itemLanguage = item['@language'].toLowerCase();
                } else if('@type' in item) {
                  itemType = item['@type'];
                } else {
                  // plain literal
                  itemLanguage = '@null';
                }
              } else {
                itemType = '@id';
              }
              if(commonLanguage === null) {
                commonLanguage = itemLanguage;
              } else if(itemLanguage !== commonLanguage && _isValue(item)) {
                commonLanguage = '@none';
              }
              if(commonType === null) {
                commonType = itemType;
              } else if(itemType !== commonType) {
                commonType = '@none';
              }
              // there are different languages and types in the list, so choose
              // the most generic term, no need to keep iterating the list
              if(commonLanguage === '@none' && commonType === '@none') {
                break;
              }
            }
            commonLanguage = commonLanguage || '@none';
            commonType = commonType || '@none';
            if(commonType !== '@none') {
              typeOrLanguage = '@type';
              typeOrLanguageValue = commonType;
            } else {
              typeOrLanguageValue = commonLanguage;
            }
          }
        } else {
          if(_isValue(value)) {
            if('@language' in value && !('@index' in value)) {
              containers.push('@language', '@language@set');
              typeOrLanguageValue = value['@language'];
              const dir = value['@direction'];
              if(dir) {
                typeOrLanguageValue = `${typeOrLanguageValue}_${dir}`;
              }
            } else if('@direction' in value && !('@index' in value)) {
              typeOrLanguageValue = `_${value['@direction']}`;
            } else if('@type' in value) {
              typeOrLanguage = '@type';
              typeOrLanguageValue = value['@type'];
            }
          } else {
            typeOrLanguage = '@type';
            typeOrLanguageValue = '@id';
          }
          containers.push('@set');
        }

        // do term selection
        containers.push('@none');

        // an index map can be used to index values using @none, so add as a low
        // priority
        if(_isObject$1(value) && !('@index' in value)) {
          // allow indexing even if no @index present
          containers.push('@index', '@index@set');
        }

        // values without type or language can use @language map
        if(_isValue(value) && Object.keys(value).length === 1) {
          // allow indexing even if no @index present
          containers.push('@language', '@language@set');
        }

        const term = _selectTerm(
          activeCtx, iri, value, containers, typeOrLanguage, typeOrLanguageValue);
        if(term !== null) {
          return term;
        }
      }

      // no term match, use @vocab if available
      if(relativeTo.vocab) {
        if('@vocab' in activeCtx) {
          // determine if vocab is a prefix of the iri
          const vocab = activeCtx['@vocab'];
          if(iri.indexOf(vocab) === 0 && iri !== vocab) {
            // use suffix as relative iri if it is not a term in the active context
            const suffix = iri.substr(vocab.length);
            if(!activeCtx.mappings.has(suffix)) {
              return suffix;
            }
          }
        }
      }

      // no term or @vocab match, check for possible CURIEs
      let choice = null;
      // TODO: make FastCurieMap a class with a method to do this lookup
      const partialMatches = [];
      let iriMap = activeCtx.fastCurieMap;
      // check for partial matches of against `iri`, which means look until
      // iri.length - 1, not full length
      const maxPartialLength = iri.length - 1;
      for(let i = 0; i < maxPartialLength && iri[i] in iriMap; ++i) {
        iriMap = iriMap[iri[i]];
        if('' in iriMap) {
          partialMatches.push(iriMap[''][0]);
        }
      }
      // check partial matches in reverse order to prefer longest ones first
      for(let i = partialMatches.length - 1; i >= 0; --i) {
        const entry = partialMatches[i];
        const terms = entry.terms;
        for(const term of terms) {
          // a CURIE is usable if:
          // 1. it has no mapping, OR
          // 2. value is null, which means we're not compacting an @value, AND
          //   the mapping matches the IRI
          const curie = term + ':' + iri.substr(entry.iri.length);
          const isUsableCurie = (activeCtx.mappings.get(term)._prefix &&
            (!activeCtx.mappings.has(curie) ||
            (value === null && activeCtx.mappings.get(curie)['@id'] === iri)));

          // select curie if it is shorter or the same length but lexicographically
          // less than the current choice
          if(isUsableCurie && (choice === null ||
            _compareShortestLeast(curie, choice) < 0)) {
            choice = curie;
          }
        }
      }

      // return chosen curie
      if(choice !== null) {
        return choice;
      }

      // If iri could be confused with a compact IRI using a term in this context,
      // signal an error
      for(const [term, td] of activeCtx.mappings) {
        if(td && td._prefix && iri.startsWith(term + ':')) {
          throw new JsonLdError_1(
            `Absolute IRI "${iri}" confused with prefix "${term}".`,
            'jsonld.SyntaxError',
            {code: 'IRI confused with prefix', context: activeCtx});
        }
      }

      // compact IRI relative to base
      if(!relativeTo.vocab) {
        if('@base' in activeCtx) {
          if(!activeCtx['@base']) {
            // The None case preserves rval as potentially relative
            return iri;
          } else {
            return _removeBase(_prependBase(base, activeCtx['@base']), iri);
          }
        } else {
          return _removeBase(base, iri);
        }
      }

      // return IRI as is
      return iri;
    };

    /**
     * Performs value compaction on an object with '@value' or '@id' as the only
     * property.
     *
     * @param activeCtx the active context.
     * @param activeProperty the active property that points to the value.
     * @param value the value to compact.
     * @param {Object} [options] - processing options.
     *
     * @return the compaction result.
     */
    api.compactValue = ({activeCtx, activeProperty, value, options}) => {
      // value is a @value
      if(_isValue(value)) {
        // get context rules
        const type = _getContextValue(activeCtx, activeProperty, '@type');
        const language = _getContextValue(activeCtx, activeProperty, '@language');
        const direction = _getContextValue(activeCtx, activeProperty, '@direction');
        const container =
          _getContextValue(activeCtx, activeProperty, '@container') || [];

        // whether or not the value has an @index that must be preserved
        const preserveIndex = '@index' in value && !container.includes('@index');

        // if there's no @index to preserve ...
        if(!preserveIndex && type !== '@none') {
          // matching @type or @language specified in context, compact value
          if(value['@type'] === type) {
            return value['@value'];
          }
          if('@language' in value && value['@language'] === language &&
             '@direction' in value && value['@direction'] === direction) {
            return value['@value'];
          }
          if('@language' in value && value['@language'] === language) {
            return value['@value'];
          }
          if('@direction' in value && value['@direction'] === direction) {
            return value['@value'];
          }
        }

        // return just the value of @value if all are true:
        // 1. @value is the only key or @index isn't being preserved
        // 2. there is no default language or @value is not a string or
        //   the key has a mapping with a null @language
        const keyCount = Object.keys(value).length;
        const isValueOnlyKey = (keyCount === 1 ||
          (keyCount === 2 && '@index' in value && !preserveIndex));
        const hasDefaultLanguage = ('@language' in activeCtx);
        const isValueString = _isString$1(value['@value']);
        const hasNullMapping = (activeCtx.mappings.has(activeProperty) &&
          activeCtx.mappings.get(activeProperty)['@language'] === null);
        if(isValueOnlyKey &&
          type !== '@none' &&
          (!hasDefaultLanguage || !isValueString || hasNullMapping)) {
          return value['@value'];
        }

        const rval = {};

        // preserve @index
        if(preserveIndex) {
          rval[api.compactIri({
            activeCtx,
            iri: '@index',
            relativeTo: {vocab: true}
          })] = value['@index'];
        }

        if('@type' in value) {
          // compact @type IRI
          rval[api.compactIri({
            activeCtx,
            iri: '@type',
            relativeTo: {vocab: true}
          })] = api.compactIri(
            {activeCtx, iri: value['@type'], relativeTo: {vocab: true}});
        } else if('@language' in value) {
          // alias @language
          rval[api.compactIri({
            activeCtx,
            iri: '@language',
            relativeTo: {vocab: true}
          })] = value['@language'];
        }

        if('@direction' in value) {
          // alias @direction
          rval[api.compactIri({
            activeCtx,
            iri: '@direction',
            relativeTo: {vocab: true}
          })] = value['@direction'];
        }

        // alias @value
        rval[api.compactIri({
          activeCtx,
          iri: '@value',
          relativeTo: {vocab: true}
        })] = value['@value'];

        return rval;
      }

      // value is a subject reference
      const expandedProperty = _expandIri$1(activeCtx, activeProperty, {vocab: true},
        options);
      const type = _getContextValue(activeCtx, activeProperty, '@type');
      const compacted = api.compactIri({
        activeCtx,
        iri: value['@id'],
        relativeTo: {vocab: type === '@vocab'},
        base: options.base});

      // compact to scalar
      if(type === '@id' || type === '@vocab' || expandedProperty === '@graph') {
        return compacted;
      }

      return {
        [api.compactIri({
          activeCtx,
          iri: '@id',
          relativeTo: {vocab: true}
        })]: compacted
      };
    };

    /**
     * Picks the preferred compaction term from the given inverse context entry.
     *
     * @param activeCtx the active context.
     * @param iri the IRI to pick the term for.
     * @param value the value to pick the term for.
     * @param containers the preferred containers.
     * @param typeOrLanguage either '@type' or '@language'.
     * @param typeOrLanguageValue the preferred value for '@type' or '@language'.
     *
     * @return the preferred term.
     */
    function _selectTerm(
      activeCtx, iri, value, containers, typeOrLanguage, typeOrLanguageValue) {
      if(typeOrLanguageValue === null) {
        typeOrLanguageValue = '@null';
      }

      // preferences for the value of @type or @language
      const prefs = [];

      // determine prefs for @id based on whether or not value compacts to a term
      if((typeOrLanguageValue === '@id' || typeOrLanguageValue === '@reverse') &&
        _isObject$1(value) && '@id' in value) {
        // prefer @reverse first
        if(typeOrLanguageValue === '@reverse') {
          prefs.push('@reverse');
        }
        // try to compact value to a term
        const term = api.compactIri(
          {activeCtx, iri: value['@id'], relativeTo: {vocab: true}});
        if(activeCtx.mappings.has(term) &&
          activeCtx.mappings.get(term) &&
          activeCtx.mappings.get(term)['@id'] === value['@id']) {
          // prefer @vocab
          prefs.push.apply(prefs, ['@vocab', '@id']);
        } else {
          // prefer @id
          prefs.push.apply(prefs, ['@id', '@vocab']);
        }
      } else {
        prefs.push(typeOrLanguageValue);

        // consider direction only
        const langDir = prefs.find(el => el.includes('_'));
        if(langDir) {
          // consider _dir portion
          prefs.push(langDir.replace(/^[^_]+_/, '_'));
        }
      }
      prefs.push('@none');

      const containerMap = activeCtx.inverse[iri];
      for(const container of containers) {
        // if container not available in the map, continue
        if(!(container in containerMap)) {
          continue;
        }

        const typeOrLanguageValueMap = containerMap[container][typeOrLanguage];
        for(const pref of prefs) {
          // if type/language option not available in the map, continue
          if(!(pref in typeOrLanguageValueMap)) {
            continue;
          }

          // select term
          return typeOrLanguageValueMap[pref];
        }
      }

      return null;
    }

    /**
     * The value of `@nest` in the term definition must either be `@nest`, or a term
     * which resolves to `@nest`.
     *
     * @param activeCtx the active context.
     * @param nestProperty a term in the active context or `@nest`.
     * @param {Object} [options] - processing options.
     */
    function _checkNestProperty(activeCtx, nestProperty, options) {
      if(_expandIri$1(activeCtx, nestProperty, {vocab: true}, options) !== '@nest') {
        throw new JsonLdError_1(
          'JSON-LD compact error; nested property must have an @nest value ' +
          'resolving to @nest.',
          'jsonld.SyntaxError', {code: 'invalid @nest value'});
      }
    }

    /*
     * Copyright (c) 2017 Digital Bazaar, Inc. All rights reserved.
     */

    var JsonLdProcessor = jsonld => {
      class JsonLdProcessor {
        toString() {
          return '[object JsonLdProcessor]';
        }
      }
      Object.defineProperty(JsonLdProcessor, 'prototype', {
        writable: false,
        enumerable: false
      });
      Object.defineProperty(JsonLdProcessor.prototype, 'constructor', {
        writable: true,
        enumerable: false,
        configurable: true,
        value: JsonLdProcessor
      });

      // The Web IDL test harness will check the number of parameters defined in
      // the functions below. The number of parameters must exactly match the
      // required (non-optional) parameters of the JsonLdProcessor interface as
      // defined here:
      // https://www.w3.org/TR/json-ld-api/#the-jsonldprocessor-interface

      JsonLdProcessor.compact = function(input, ctx) {
        if(arguments.length < 2) {
          return Promise.reject(
            new TypeError('Could not compact, too few arguments.'));
        }
        return jsonld.compact(input, ctx);
      };
      JsonLdProcessor.expand = function(input) {
        if(arguments.length < 1) {
          return Promise.reject(
            new TypeError('Could not expand, too few arguments.'));
        }
        return jsonld.expand(input);
      };
      JsonLdProcessor.flatten = function(input) {
        if(arguments.length < 1) {
          return Promise.reject(
            new TypeError('Could not flatten, too few arguments.'));
        }
        return jsonld.flatten(input);
      };

      return JsonLdProcessor;
    };

    /**
     * A JavaScript implementation of the JSON-LD API.
     *
     * @author Dave Longley
     *
     * @license BSD 3-Clause License
     * Copyright (c) 2011-2019 Digital Bazaar, Inc.
     * All rights reserved.
     *
     * Redistribution and use in source and binary forms, with or without
     * modification, are permitted provided that the following conditions are met:
     *
     * Redistributions of source code must retain the above copyright notice,
     * this list of conditions and the following disclaimer.
     *
     * Redistributions in binary form must reproduce the above copyright
     * notice, this list of conditions and the following disclaimer in the
     * documentation and/or other materials provided with the distribution.
     *
     * Neither the name of the Digital Bazaar, Inc. nor the names of its
     * contributors may be used to endorse or promote products derived from
     * this software without specific prior written permission.
     *
     * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
     * IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
     * TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
     * PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
     * HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
     * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
     * TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
     * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
     * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
     * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
     * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
     */

    const IdentifierIssuer = util.IdentifierIssuer;




    const {expand: _expand} = expand$1;
    const {flatten: _flatten} = flatten;
    const {fromRDF: _fromRDF} = fromRdf;
    const {toRDF: _toRDF} = toRdf;

    const {
      frameMergedOrDefault: _frameMergedOrDefault,
      cleanupNull: _cleanupNull
    } = frame;

    const {
      isArray: _isArray,
      isObject: _isObject,
      isString: _isString
    } = types;

    const {
      isSubjectReference: _isSubjectReference,
    } = graphTypes;

    const {
      expandIri: _expandIri,
      getInitialContext: _getInitialContext,
      process: _processContext,
      processingMode: _processingMode
    } = context;

    const {
      compact: _compact,
      compactIri: _compactIri
    } = compact;

    const {
      createNodeMap: _createNodeMap,
      createMergedNodeMap: _createMergedNodeMap,
      mergeNodeMaps: _mergeNodeMaps
    } = nodeMap;

    /* eslint-disable indent */
    // attaches jsonld API to the given object
    const wrapper = function(jsonld) {

    /** Registered RDF dataset parsers hashed by content-type. */
    const _rdfParsers = {};

    // resolved context cache
    // TODO: consider basing max on context size rather than number
    const RESOLVED_CONTEXT_CACHE_MAX_SIZE = 100;
    const _resolvedContextCache = new lruCache({max: RESOLVED_CONTEXT_CACHE_MAX_SIZE});

    /* Core API */

    /**
     * Performs JSON-LD compaction.
     *
     * @param input the JSON-LD input to compact.
     * @param ctx the context to compact with.
     * @param [options] options to use:
     *          [base] the base IRI to use.
     *          [compactArrays] true to compact arrays to single values when
     *            appropriate, false not to (default: true).
     *          [compactToRelative] true to compact IRIs to be relative to document
     *            base, false to keep absolute (default: true)
     *          [graph] true to always output a top-level graph (default: false).
     *          [expandContext] a context to expand with.
     *          [skipExpansion] true to assume the input is expanded and skip
     *            expansion, false not to, defaults to false.
     *          [documentLoader(url, options)] the document loader.
     *          [expansionMap(info)] a function that can be used to custom map
     *            unmappable values (or to throw an error when they are detected);
     *            if this function returns `undefined` then the default behavior
     *            will be used.
     *          [framing] true if compaction is occuring during a framing operation.
     *          [compactionMap(info)] a function that can be used to custom map
     *            unmappable values (or to throw an error when they are detected);
     *            if this function returns `undefined` then the default behavior
     *            will be used.
     *          [contextResolver] internal use only.
     *
     * @return a Promise that resolves to the compacted output.
     */
    jsonld.compact = async function(input, ctx, options) {
      if(arguments.length < 2) {
        throw new TypeError('Could not compact, too few arguments.');
      }

      if(ctx === null) {
        throw new JsonLdError_1(
          'The compaction context must not be null.',
          'jsonld.CompactError', {code: 'invalid local context'});
      }

      // nothing to compact
      if(input === null) {
        return null;
      }

      // set default options
      options = _setDefaults(options, {
        base: _isString(input) ? input : '',
        compactArrays: true,
        compactToRelative: true,
        graph: false,
        skipExpansion: false,
        link: false,
        issuer: new IdentifierIssuer('_:b'),
        contextResolver: new ContextResolver_1(
          {sharedCache: _resolvedContextCache})
      });
      if(options.link) {
        // force skip expansion when linking, "link" is not part of the public
        // API, it should only be called from framing
        options.skipExpansion = true;
      }
      if(!options.compactToRelative) {
        delete options.base;
      }

      // expand input
      let expanded;
      if(options.skipExpansion) {
        expanded = input;
      } else {
        expanded = await jsonld.expand(input, options);
      }

      // process context
      const activeCtx = await jsonld.processContext(
        _getInitialContext(options), ctx, options);

      // do compaction
      let compacted = await _compact({
        activeCtx,
        element: expanded,
        options,
        compactionMap: options.compactionMap
      });

      // perform clean up
      if(options.compactArrays && !options.graph && _isArray(compacted)) {
        if(compacted.length === 1) {
          // simplify to a single item
          compacted = compacted[0];
        } else if(compacted.length === 0) {
          // simplify to an empty object
          compacted = {};
        }
      } else if(options.graph && _isObject(compacted)) {
        // always use array if graph option is on
        compacted = [compacted];
      }

      // follow @context key
      if(_isObject(ctx) && '@context' in ctx) {
        ctx = ctx['@context'];
      }

      // build output context
      ctx = util.clone(ctx);
      if(!_isArray(ctx)) {
        ctx = [ctx];
      }
      // remove empty contexts
      const tmp = ctx;
      ctx = [];
      for(let i = 0; i < tmp.length; ++i) {
        if(!_isObject(tmp[i]) || Object.keys(tmp[i]).length > 0) {
          ctx.push(tmp[i]);
        }
      }

      // remove array if only one context
      const hasContext = (ctx.length > 0);
      if(ctx.length === 1) {
        ctx = ctx[0];
      }

      // add context and/or @graph
      if(_isArray(compacted)) {
        // use '@graph' keyword
        const graphAlias = _compactIri({
          activeCtx, iri: '@graph', relativeTo: {vocab: true}
        });
        const graph = compacted;
        compacted = {};
        if(hasContext) {
          compacted['@context'] = ctx;
        }
        compacted[graphAlias] = graph;
      } else if(_isObject(compacted) && hasContext) {
        // reorder keys so @context is first
        const graph = compacted;
        compacted = {'@context': ctx};
        for(const key in graph) {
          compacted[key] = graph[key];
        }
      }

      return compacted;
    };

    /**
     * Performs JSON-LD expansion.
     *
     * @param input the JSON-LD input to expand.
     * @param [options] the options to use:
     *          [base] the base IRI to use.
     *          [expandContext] a context to expand with.
     *          [keepFreeFloatingNodes] true to keep free-floating nodes,
     *            false not to, defaults to false.
     *          [documentLoader(url, options)] the document loader.
     *          [expansionMap(info)] a function that can be used to custom map
     *            unmappable values (or to throw an error when they are detected);
     *            if this function returns `undefined` then the default behavior
     *            will be used.
     *          [contextResolver] internal use only.
     *
     * @return a Promise that resolves to the expanded output.
     */
    jsonld.expand = async function(input, options) {
      if(arguments.length < 1) {
        throw new TypeError('Could not expand, too few arguments.');
      }

      // set default options
      options = _setDefaults(options, {
        keepFreeFloatingNodes: false,
        contextResolver: new ContextResolver_1(
          {sharedCache: _resolvedContextCache})
      });
      if(options.expansionMap === false) {
        options.expansionMap = undefined;
      }

      // build set of objects that may have @contexts to resolve
      const toResolve = {};

      // build set of contexts to process prior to expansion
      const contextsToProcess = [];

      // if an `expandContext` has been given ensure it gets resolved
      if('expandContext' in options) {
        const expandContext = util.clone(options.expandContext);
        if(_isObject(expandContext) && '@context' in expandContext) {
          toResolve.expandContext = expandContext;
        } else {
          toResolve.expandContext = {'@context': expandContext};
        }
        contextsToProcess.push(toResolve.expandContext);
      }

      // if input is a string, attempt to dereference remote document
      let defaultBase;
      if(!_isString(input)) {
        // input is not a URL, do not need to retrieve it first
        toResolve.input = util.clone(input);
      } else {
        // load remote doc
        const remoteDoc = await jsonld.get(input, options);
        defaultBase = remoteDoc.documentUrl;
        toResolve.input = remoteDoc.document;
        if(remoteDoc.contextUrl) {
          // context included in HTTP link header and must be resolved
          toResolve.remoteContext = {'@context': remoteDoc.contextUrl};
          contextsToProcess.push(toResolve.remoteContext);
        }
      }

      // set default base
      if(!('base' in options)) {
        options.base = defaultBase || '';
      }

      // process any additional contexts
      let activeCtx = _getInitialContext(options);
      for(const localCtx of contextsToProcess) {
        activeCtx = await _processContext({activeCtx, localCtx, options});
      }

      // expand resolved input
      let expanded = await _expand({
        activeCtx,
        element: toResolve.input,
        options,
        expansionMap: options.expansionMap
      });

      // optimize away @graph with no other properties
      if(_isObject(expanded) && ('@graph' in expanded) &&
        Object.keys(expanded).length === 1) {
        expanded = expanded['@graph'];
      } else if(expanded === null) {
        expanded = [];
      }

      // normalize to an array
      if(!_isArray(expanded)) {
        expanded = [expanded];
      }

      return expanded;
    };

    /**
     * Performs JSON-LD flattening.
     *
     * @param input the JSON-LD to flatten.
     * @param ctx the context to use to compact the flattened output, or null.
     * @param [options] the options to use:
     *          [base] the base IRI to use.
     *          [expandContext] a context to expand with.
     *          [documentLoader(url, options)] the document loader.
     *          [contextResolver] internal use only.
     *
     * @return a Promise that resolves to the flattened output.
     */
    jsonld.flatten = async function(input, ctx, options) {
      if(arguments.length < 1) {
        return new TypeError('Could not flatten, too few arguments.');
      }

      if(typeof ctx === 'function') {
        ctx = null;
      } else {
        ctx = ctx || null;
      }

      // set default options
      options = _setDefaults(options, {
        base: _isString(input) ? input : '',
        contextResolver: new ContextResolver_1(
          {sharedCache: _resolvedContextCache})
      });

      // expand input
      const expanded = await jsonld.expand(input, options);

      // do flattening
      const flattened = _flatten(expanded);

      if(ctx === null) {
        // no compaction required
        return flattened;
      }

      // compact result (force @graph option to true, skip expansion)
      options.graph = true;
      options.skipExpansion = true;
      const compacted = await jsonld.compact(flattened, ctx, options);

      return compacted;
    };

    /**
     * Performs JSON-LD framing.
     *
     * @param input the JSON-LD input to frame.
     * @param frame the JSON-LD frame to use.
     * @param [options] the framing options.
     *          [base] the base IRI to use.
     *          [expandContext] a context to expand with.
     *          [embed] default @embed flag: '@last', '@always', '@never', '@link'
     *            (default: '@last').
     *          [explicit] default @explicit flag (default: false).
     *          [requireAll] default @requireAll flag (default: true).
     *          [omitDefault] default @omitDefault flag (default: false).
     *          [documentLoader(url, options)] the document loader.
     *          [contextResolver] internal use only.
     *
     * @return a Promise that resolves to the framed output.
     */
    jsonld.frame = async function(input, frame, options) {
      if(arguments.length < 2) {
        throw new TypeError('Could not frame, too few arguments.');
      }

      // set default options
      options = _setDefaults(options, {
        base: _isString(input) ? input : '',
        embed: '@once',
        explicit: false,
        requireAll: false,
        omitDefault: false,
        bnodesToClear: [],
        contextResolver: new ContextResolver_1(
          {sharedCache: _resolvedContextCache})
      });

      // if frame is a string, attempt to dereference remote document
      if(_isString(frame)) {
        // load remote doc
        const remoteDoc = await jsonld.get(frame, options);
        frame = remoteDoc.document;

        if(remoteDoc.contextUrl) {
          // inject link header @context into frame
          let ctx = frame['@context'];
          if(!ctx) {
            ctx = remoteDoc.contextUrl;
          } else if(_isArray(ctx)) {
            ctx.push(remoteDoc.contextUrl);
          } else {
            ctx = [ctx, remoteDoc.contextUrl];
          }
          frame['@context'] = ctx;
        }
      }

      const frameContext = frame ? frame['@context'] || {} : {};

      // process context
      const activeCtx = await jsonld.processContext(
        _getInitialContext(options), frameContext, options);

      // mode specific defaults
      if(!options.hasOwnProperty('omitGraph')) {
        options.omitGraph = _processingMode(activeCtx, 1.1);
      }
      if(!options.hasOwnProperty('pruneBlankNodeIdentifiers')) {
        options.pruneBlankNodeIdentifiers = _processingMode(activeCtx, 1.1);
      }

      // expand input
      const expanded = await jsonld.expand(input, options);

      // expand frame
      const opts = {...options};
      opts.isFrame = true;
      opts.keepFreeFloatingNodes = true;
      const expandedFrame = await jsonld.expand(frame, opts);

      // if the unexpanded frame includes a key expanding to @graph, frame the
      // default graph, otherwise, the merged graph
      const frameKeys = Object.keys(frame)
        .map(key => _expandIri(activeCtx, key, {vocab: true}));
      opts.merged = !frameKeys.includes('@graph');
      opts.is11 = _processingMode(activeCtx, 1.1);

      // do framing
      const framed = _frameMergedOrDefault(expanded, expandedFrame, opts);

      opts.graph = !options.omitGraph;
      opts.skipExpansion = true;
      opts.link = {};
      opts.framing = true;
      let compacted = await jsonld.compact(framed, frameContext, opts);

      // replace @null with null, compacting arrays
      opts.link = {};
      compacted = _cleanupNull(compacted, opts);

      return compacted;
    };

    /**
     * **Experimental**
     *
     * Links a JSON-LD document's nodes in memory.
     *
     * @param input the JSON-LD document to link.
     * @param [ctx] the JSON-LD context to apply.
     * @param [options] the options to use:
     *          [base] the base IRI to use.
     *          [expandContext] a context to expand with.
     *          [documentLoader(url, options)] the document loader.
     *          [contextResolver] internal use only.
     *
     * @return a Promise that resolves to the linked output.
     */
    jsonld.link = async function(input, ctx, options) {
      // API matches running frame with a wildcard frame and embed: '@link'
      // get arguments
      const frame = {};
      if(ctx) {
        frame['@context'] = ctx;
      }
      frame['@embed'] = '@link';
      return jsonld.frame(input, frame, options);
    };

    /**
     * Performs RDF dataset normalization on the given input. The input is JSON-LD
     * unless the 'inputFormat' option is used. The output is an RDF dataset
     * unless the 'format' option is used.
     *
     * @param input the input to normalize as JSON-LD or as a format specified by
     *          the 'inputFormat' option.
     * @param [options] the options to use:
     *          [algorithm] the normalization algorithm to use, `URDNA2015` or
     *            `URGNA2012` (default: `URDNA2015`).
     *          [base] the base IRI to use.
     *          [expandContext] a context to expand with.
     *          [skipExpansion] true to assume the input is expanded and skip
     *            expansion, false not to, defaults to false.
     *          [inputFormat] the format if input is not JSON-LD:
     *            'application/n-quads' for N-Quads.
     *          [format] the format if output is a string:
     *            'application/n-quads' for N-Quads.
     *          [documentLoader(url, options)] the document loader.
     *          [useNative] true to use a native canonize algorithm
     *          [contextResolver] internal use only.
     *
     * @return a Promise that resolves to the normalized output.
     */
    jsonld.normalize = jsonld.canonize = async function(input, options) {
      if(arguments.length < 1) {
        throw new TypeError('Could not canonize, too few arguments.');
      }

      // set default options
      options = _setDefaults(options, {
        base: _isString(input) ? input : '',
        algorithm: 'URDNA2015',
        skipExpansion: false,
        contextResolver: new ContextResolver_1(
          {sharedCache: _resolvedContextCache})
      });
      if('inputFormat' in options) {
        if(options.inputFormat !== 'application/n-quads' &&
          options.inputFormat !== 'application/nquads') {
          throw new JsonLdError_1(
            'Unknown canonicalization input format.',
            'jsonld.CanonizeError');
        }
        // TODO: `await` for async parsers
        const parsedInput = NQuads.parse(input);

        // do canonicalization
        return rdfCanonize.canonize(parsedInput, options);
      }

      // convert to RDF dataset then do normalization
      const opts = {...options};
      delete opts.format;
      opts.produceGeneralizedRdf = false;
      const dataset = await jsonld.toRDF(input, opts);

      // do canonicalization
      return rdfCanonize.canonize(dataset, options);
    };

    /**
     * Converts an RDF dataset to JSON-LD.
     *
     * @param dataset a serialized string of RDF in a format specified by the
     *          format option or an RDF dataset to convert.
     * @param [options] the options to use:
     *          [format] the format if dataset param must first be parsed:
     *            'application/n-quads' for N-Quads (default).
     *          [rdfParser] a custom RDF-parser to use to parse the dataset.
     *          [useRdfType] true to use rdf:type, false to use @type
     *            (default: false).
     *          [useNativeTypes] true to convert XSD types into native types
     *            (boolean, integer, double), false not to (default: false).
     *
     * @return a Promise that resolves to the JSON-LD document.
     */
    jsonld.fromRDF = async function(dataset, options) {
      if(arguments.length < 1) {
        throw new TypeError('Could not convert from RDF, too few arguments.');
      }

      // set default options
      options = _setDefaults(options, {
        format: _isString(dataset) ? 'application/n-quads' : undefined
      });

      const {format} = options;
      let {rdfParser} = options;

      // handle special format
      if(format) {
        // check supported formats
        rdfParser = rdfParser || _rdfParsers[format];
        if(!rdfParser) {
          throw new JsonLdError_1(
            'Unknown input format.',
            'jsonld.UnknownFormat', {format});
        }
      } else {
        // no-op parser, assume dataset already parsed
        rdfParser = () => dataset;
      }

      // rdfParser must be synchronous or return a promise, no callback support
      const parsedDataset = await rdfParser(dataset);
      return _fromRDF(parsedDataset, options);
    };

    /**
     * Outputs the RDF dataset found in the given JSON-LD object.
     *
     * @param input the JSON-LD input.
     * @param [options] the options to use:
     *          [base] the base IRI to use.
     *          [expandContext] a context to expand with.
     *          [skipExpansion] true to assume the input is expanded and skip
     *            expansion, false not to, defaults to false.
     *          [format] the format to use to output a string:
     *            'application/n-quads' for N-Quads.
     *          [produceGeneralizedRdf] true to output generalized RDF, false
     *            to produce only standard RDF (default: false).
     *          [documentLoader(url, options)] the document loader.
     *          [contextResolver] internal use only.
     *
     * @return a Promise that resolves to the RDF dataset.
     */
    jsonld.toRDF = async function(input, options) {
      if(arguments.length < 1) {
        throw new TypeError('Could not convert to RDF, too few arguments.');
      }

      // set default options
      options = _setDefaults(options, {
        base: _isString(input) ? input : '',
        skipExpansion: false,
        contextResolver: new ContextResolver_1(
          {sharedCache: _resolvedContextCache})
      });

      // TODO: support toRDF custom map?
      let expanded;
      if(options.skipExpansion) {
        expanded = input;
      } else {
        // expand input
        expanded = await jsonld.expand(input, options);
      }

      // output RDF dataset
      const dataset = _toRDF(expanded, options);
      if(options.format) {
        if(options.format === 'application/n-quads' ||
          options.format === 'application/nquads') {
          return NQuads.serialize(dataset);
        }
        throw new JsonLdError_1(
          'Unknown output format.',
          'jsonld.UnknownFormat', {format: options.format});
      }

      return dataset;
    };

    /**
     * **Experimental**
     *
     * Recursively flattens the nodes in the given JSON-LD input into a merged
     * map of node ID => node. All graphs will be merged into the default graph.
     *
     * @param input the JSON-LD input.
     * @param [options] the options to use:
     *          [base] the base IRI to use.
     *          [expandContext] a context to expand with.
     *          [issuer] a jsonld.IdentifierIssuer to use to label blank nodes.
     *          [documentLoader(url, options)] the document loader.
     *          [contextResolver] internal use only.
     *
     * @return a Promise that resolves to the merged node map.
     */
    jsonld.createNodeMap = async function(input, options) {
      if(arguments.length < 1) {
        throw new TypeError('Could not create node map, too few arguments.');
      }

      // set default options
      options = _setDefaults(options, {
        base: _isString(input) ? input : '',
        contextResolver: new ContextResolver_1(
          {sharedCache: _resolvedContextCache})
      });

      // expand input
      const expanded = await jsonld.expand(input, options);

      return _createMergedNodeMap(expanded, options);
    };

    /**
     * **Experimental**
     *
     * Merges two or more JSON-LD documents into a single flattened document.
     *
     * @param docs the JSON-LD documents to merge together.
     * @param ctx the context to use to compact the merged result, or null.
     * @param [options] the options to use:
     *          [base] the base IRI to use.
     *          [expandContext] a context to expand with.
     *          [issuer] a jsonld.IdentifierIssuer to use to label blank nodes.
     *          [mergeNodes] true to merge properties for nodes with the same ID,
     *            false to ignore new properties for nodes with the same ID once
     *            the ID has been defined; note that this may not prevent merging
     *            new properties where a node is in the `object` position
     *            (default: true).
     *          [documentLoader(url, options)] the document loader.
     *          [contextResolver] internal use only.
     *
     * @return a Promise that resolves to the merged output.
     */
    jsonld.merge = async function(docs, ctx, options) {
      if(arguments.length < 1) {
        throw new TypeError('Could not merge, too few arguments.');
      }
      if(!_isArray(docs)) {
        throw new TypeError('Could not merge, "docs" must be an array.');
      }

      if(typeof ctx === 'function') {
        ctx = null;
      } else {
        ctx = ctx || null;
      }

      // set default options
      options = _setDefaults(options, {
        contextResolver: new ContextResolver_1(
          {sharedCache: _resolvedContextCache})
      });

      // expand all documents
      const expanded = await Promise.all(docs.map(doc => {
        const opts = {...options};
        return jsonld.expand(doc, opts);
      }));

      let mergeNodes = true;
      if('mergeNodes' in options) {
        mergeNodes = options.mergeNodes;
      }

      const issuer = options.issuer || new IdentifierIssuer('_:b');
      const graphs = {'@default': {}};

      for(let i = 0; i < expanded.length; ++i) {
        // uniquely relabel blank nodes
        const doc = util.relabelBlankNodes(expanded[i], {
          issuer: new IdentifierIssuer('_:b' + i + '-')
        });

        // add nodes to the shared node map graphs if merging nodes, to a
        // separate graph set if not
        const _graphs = (mergeNodes || i === 0) ? graphs : {'@default': {}};
        _createNodeMap(doc, _graphs, '@default', issuer);

        if(_graphs !== graphs) {
          // merge document graphs but don't merge existing nodes
          for(const graphName in _graphs) {
            const _nodeMap = _graphs[graphName];
            if(!(graphName in graphs)) {
              graphs[graphName] = _nodeMap;
              continue;
            }
            const nodeMap = graphs[graphName];
            for(const key in _nodeMap) {
              if(!(key in nodeMap)) {
                nodeMap[key] = _nodeMap[key];
              }
            }
          }
        }
      }

      // add all non-default graphs to default graph
      const defaultGraph = _mergeNodeMaps(graphs);

      // produce flattened output
      const flattened = [];
      const keys = Object.keys(defaultGraph).sort();
      for(let ki = 0; ki < keys.length; ++ki) {
        const node = defaultGraph[keys[ki]];
        // only add full subjects to top-level
        if(!_isSubjectReference(node)) {
          flattened.push(node);
        }
      }

      if(ctx === null) {
        return flattened;
      }

      // compact result (force @graph option to true, skip expansion)
      options.graph = true;
      options.skipExpansion = true;
      const compacted = await jsonld.compact(flattened, ctx, options);

      return compacted;
    };

    /**
     * The default document loader for external documents.
     *
     * @param url the URL to load.
     *
     * @return a promise that resolves to the remote document.
     */
    Object.defineProperty(jsonld, 'documentLoader', {
      get: () => jsonld._documentLoader,
      set: v => jsonld._documentLoader = v
    });
    // default document loader not implemented
    jsonld.documentLoader = async url => {
      throw new JsonLdError_1(
        'Could not retrieve a JSON-LD document from the URL. URL ' +
        'dereferencing not implemented.', 'jsonld.LoadDocumentError',
        {code: 'loading document failed', url});
    };

    /**
     * Gets a remote JSON-LD document using the default document loader or
     * one given in the passed options.
     *
     * @param url the URL to fetch.
     * @param [options] the options to use:
     *          [documentLoader] the document loader to use.
     *
     * @return a Promise that resolves to the retrieved remote document.
     */
    jsonld.get = async function(url, options) {
      let load;
      if(typeof options.documentLoader === 'function') {
        load = options.documentLoader;
      } else {
        load = jsonld.documentLoader;
      }

      const remoteDoc = await load(url);

      try {
        if(!remoteDoc.document) {
          throw new JsonLdError_1(
            'No remote document found at the given URL.',
            'jsonld.NullRemoteDocument');
        }
        if(_isString(remoteDoc.document)) {
          remoteDoc.document = JSON.parse(remoteDoc.document);
        }
      } catch(e) {
        throw new JsonLdError_1(
          'Could not retrieve a JSON-LD document from the URL.',
          'jsonld.LoadDocumentError', {
            code: 'loading document failed',
            cause: e,
            remoteDoc
          });
      }

      return remoteDoc;
    };

    /**
     * Processes a local context, resolving any URLs as necessary, and returns a
     * new active context.
     *
     * @param activeCtx the current active context.
     * @param localCtx the local context to process.
     * @param [options] the options to use:
     *          [documentLoader(url, options)] the document loader.
     *          [contextResolver] internal use only.
     *
     * @return a Promise that resolves to the new active context.
     */
    jsonld.processContext = async function(
      activeCtx, localCtx, options) {
      // set default options
      options = _setDefaults(options, {
        base: '',
        contextResolver: new ContextResolver_1(
          {sharedCache: _resolvedContextCache})
      });

      // return initial context early for null context
      if(localCtx === null) {
        return _getInitialContext(options);
      }

      // get URLs in localCtx
      localCtx = util.clone(localCtx);
      if(!(_isObject(localCtx) && '@context' in localCtx)) {
        localCtx = {'@context': localCtx};
      }

      return _processContext({activeCtx, localCtx, options});
    };

    // backwards compatibility
    jsonld.getContextValue = context.getContextValue;

    /**
     * Document loaders.
     */
    jsonld.documentLoaders = {};

    /**
     * Assigns the default document loader for external document URLs to a built-in
     * default. Supported types currently include: 'xhr' and 'node'.
     *
     * @param type the type to set.
     * @param [params] the parameters required to use the document loader.
     */
    jsonld.useDocumentLoader = function(type) {
      if(!(type in jsonld.documentLoaders)) {
        throw new JsonLdError_1(
          'Unknown document loader type: "' + type + '"',
          'jsonld.UnknownDocumentLoader',
          {type});
      }

      // set document loader
      jsonld.documentLoader = jsonld.documentLoaders[type].apply(
        jsonld, Array.prototype.slice.call(arguments, 1));
    };

    /**
     * Registers an RDF dataset parser by content-type, for use with
     * jsonld.fromRDF. An RDF dataset parser will always be given one parameter,
     * a string of input. An RDF dataset parser can be synchronous or
     * asynchronous (by returning a promise).
     *
     * @param contentType the content-type for the parser.
     * @param parser(input) the parser function (takes a string as a parameter
     *          and either returns an RDF dataset or a Promise that resolves to one.
     */
    jsonld.registerRDFParser = function(contentType, parser) {
      _rdfParsers[contentType] = parser;
    };

    /**
     * Unregisters an RDF dataset parser by content-type.
     *
     * @param contentType the content-type for the parser.
     */
    jsonld.unregisterRDFParser = function(contentType) {
      delete _rdfParsers[contentType];
    };

    // register the N-Quads RDF parser
    jsonld.registerRDFParser('application/n-quads', NQuads.parse);
    jsonld.registerRDFParser('application/nquads', NQuads.parse);

    /* URL API */
    jsonld.url = url;

    /* Utility API */
    jsonld.util = util;
    // backwards compatibility
    Object.assign(jsonld, util);

    // reexpose API as jsonld.promises for backwards compatability
    jsonld.promises = jsonld;

    // backwards compatibility
    jsonld.RequestQueue = RequestQueue_1;

    /* WebIDL API */
    jsonld.JsonLdProcessor = JsonLdProcessor(jsonld);

    platformBrowser.setupGlobals(jsonld);
    platformBrowser.setupDocumentLoaders(jsonld);

    function _setDefaults(options, {
      documentLoader = jsonld.documentLoader,
      ...defaults
    }) {
      return Object.assign({}, {documentLoader}, defaults, options);
    }

    // end of jsonld API `wrapper` factory
    return jsonld;
    };

    // external APIs:

    // used to generate a new jsonld API instance
    const factory = function() {
      return wrapper(function() {
        return factory();
      });
    };

    // wrap the main jsonld API instance
    wrapper(factory);
    // export API
    var jsonld = factory;

    var umap = _ => ({
      // About: get: _.get.bind(_)
      // It looks like WebKit/Safari didn't optimize bind at all,
      // so that using bind slows it down by 60%.
      // Firefox and Chrome are just fine in both cases,
      // so let's use the approach that works fast everywhere 👍
      get: key => _.get(key),
      set: (key, value) => (_.set(key, value), value)
    });

    const attr = /([^\s\\>"'=]+)\s*=\s*(['"]?)$/;
    const empty = /^(?:area|base|br|col|embed|hr|img|input|keygen|link|menuitem|meta|param|source|track|wbr)$/i;
    const node = /<[a-z][^>]+$/i;
    const notNode = />[^<>]*$/;
    const selfClosing = /<([a-z]+[a-z0-9:._-]*)([^>]*?)(\/>)/ig;
    const trimEnd = /\s+$/;

    const isNode = (template, i) => (
        0 < i-- && (
        node.test(template[i]) || (
          !notNode.test(template[i]) && isNode(template, i)
        )
      )
    );

    const regular = (original, name, extra) => empty.test(name) ?
                      original : `<${name}${extra.replace(trimEnd,'')}></${name}>`;

    var instrument = (template, prefix, svg) => {
      const text = [];
      const {length} = template;
      for (let i = 1; i < length; i++) {
        const chunk = template[i - 1];
        text.push(attr.test(chunk) && isNode(template, i) ?
          chunk.replace(
            attr,
            (_, $1, $2) => `${prefix}${i - 1}=${$2 || '"'}${$1}${$2 ? '' : '"'}`
          ) :
          `${chunk}<!--${prefix}${i - 1}-->`
        );
      }
      text.push(template[length - 1]);
      const output = text.join('').trim();
      return svg ? output : output.replace(selfClosing, regular);
    };

    const {isArray: isArray$1} = Array;
    const {indexOf, slice} = [];

    const ELEMENT_NODE = 1;
    const nodeType = 111;

    const remove = ({firstChild, lastChild}) => {
      const range = document.createRange();
      range.setStartAfter(firstChild);
      range.setEndAfter(lastChild);
      range.deleteContents();
      return firstChild;
    };

    const diffable = (node, operation) => node.nodeType === nodeType ?
      ((1 / operation) < 0 ?
        (operation ? remove(node) : node.lastChild) :
        (operation ? node.valueOf() : node.firstChild)) :
      node
    ;

    const persistent = fragment => {
      const {childNodes} = fragment;
      const {length} = childNodes;
      if (length < 2)
        return length ? childNodes[0] : fragment;
      const nodes = slice.call(childNodes, 0);
      const firstChild = nodes[0];
      const lastChild = nodes[length - 1];
      return {
        ELEMENT_NODE,
        nodeType,
        firstChild,
        lastChild,
        valueOf() {
          if (childNodes.length !== length) {
            let i = 0;
            while (i < length)
              fragment.appendChild(nodes[i++]);
          }
          return fragment;
        }
      };
    };

    /**
     * ISC License
     *
     * Copyright (c) 2020, Andrea Giammarchi, @WebReflection
     *
     * Permission to use, copy, modify, and/or distribute this software for any
     * purpose with or without fee is hereby granted, provided that the above
     * copyright notice and this permission notice appear in all copies.
     *
     * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
     * REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
     * AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
     * INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
     * LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE
     * OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
     * PERFORMANCE OF THIS SOFTWARE.
     */

    /**
     * @param {Node} parentNode The container where children live
     * @param {Node[]} a The list of current/live children
     * @param {Node[]} b The list of future children
     * @param {(entry: Node, action: number) => Node} get
     * The callback invoked per each entry related DOM operation.
     * @param {Node} [before] The optional node used as anchor to insert before.
     * @returns {Node[]} The same list of future children.
     */
    var udomdiff = (parentNode, a, b, get, before) => {
      const bLength = b.length;
      let aEnd = a.length;
      let bEnd = bLength;
      let aStart = 0;
      let bStart = 0;
      let map = null;
      while (aStart < aEnd || bStart < bEnd) {
        // append head, tail, or nodes in between: fast path
        if (aEnd === aStart) {
          // we could be in a situation where the rest of nodes that
          // need to be added are not at the end, and in such case
          // the node to `insertBefore`, if the index is more than 0
          // must be retrieved, otherwise it's gonna be the first item.
          const node = bEnd < bLength ?
            (bStart ?
              (get(b[bStart - 1], -0).nextSibling) :
              get(b[bEnd - bStart], 0)) :
            before;
          while (bStart < bEnd)
            parentNode.insertBefore(get(b[bStart++], 1), node);
        }
        // remove head or tail: fast path
        else if (bEnd === bStart) {
          while (aStart < aEnd) {
            // remove the node only if it's unknown or not live
            if (!map || !map.has(a[aStart]))
              parentNode.removeChild(get(a[aStart], -1));
            aStart++;
          }
        }
        // same node: fast path
        else if (a[aStart] === b[bStart]) {
          aStart++;
          bStart++;
        }
        // same tail: fast path
        else if (a[aEnd - 1] === b[bEnd - 1]) {
          aEnd--;
          bEnd--;
        }
        // The once here single last swap "fast path" has been removed in v1.1.0
        // https://github.com/WebReflection/udomdiff/blob/single-final-swap/esm/index.js#L69-L85
        // reverse swap: also fast path
        else if (
          a[aStart] === b[bEnd - 1] &&
          b[bStart] === a[aEnd - 1]
        ) {
          // this is a "shrink" operation that could happen in these cases:
          // [1, 2, 3, 4, 5]
          // [1, 4, 3, 2, 5]
          // or asymmetric too
          // [1, 2, 3, 4, 5]
          // [1, 2, 3, 5, 6, 4]
          const node = get(a[--aEnd], -1).nextSibling;
          parentNode.insertBefore(
            get(b[bStart++], 1),
            get(a[aStart++], -1).nextSibling
          );
          parentNode.insertBefore(get(b[--bEnd], 1), node);
          // mark the future index as identical (yeah, it's dirty, but cheap 👍)
          // The main reason to do this, is that when a[aEnd] will be reached,
          // the loop will likely be on the fast path, as identical to b[bEnd].
          // In the best case scenario, the next loop will skip the tail,
          // but in the worst one, this node will be considered as already
          // processed, bailing out pretty quickly from the map index check
          a[aEnd] = b[bEnd];
        }
        // map based fallback, "slow" path
        else {
          // the map requires an O(bEnd - bStart) operation once
          // to store all future nodes indexes for later purposes.
          // In the worst case scenario, this is a full O(N) cost,
          // and such scenario happens at least when all nodes are different,
          // but also if both first and last items of the lists are different
          if (!map) {
            map = new Map;
            let i = bStart;
            while (i < bEnd)
              map.set(b[i], i++);
          }
          // if it's a future node, hence it needs some handling
          if (map.has(a[aStart])) {
            // grab the index of such node, 'cause it might have been processed
            const index = map.get(a[aStart]);
            // if it's not already processed, look on demand for the next LCS
            if (bStart < index && index < bEnd) {
              let i = aStart;
              // counts the amount of nodes that are the same in the future
              let sequence = 1;
              while (++i < aEnd && i < bEnd && map.get(a[i]) === (index + sequence))
                sequence++;
              // effort decision here: if the sequence is longer than replaces
              // needed to reach such sequence, which would brings again this loop
              // to the fast path, prepend the difference before a sequence,
              // and move only the future list index forward, so that aStart
              // and bStart will be aligned again, hence on the fast path.
              // An example considering aStart and bStart are both 0:
              // a: [1, 2, 3, 4]
              // b: [7, 1, 2, 3, 6]
              // this would place 7 before 1 and, from that time on, 1, 2, and 3
              // will be processed at zero cost
              if (sequence > (index - bStart)) {
                const node = get(a[aStart], 0);
                while (bStart < index)
                  parentNode.insertBefore(get(b[bStart++], 1), node);
              }
              // if the effort wasn't good enough, fallback to a replace,
              // moving both source and target indexes forward, hoping that some
              // similar node will be found later on, to go back to the fast path
              else {
                parentNode.replaceChild(
                  get(b[bStart++], 1),
                  get(a[aStart++], -1)
                );
              }
            }
            // otherwise move the source forward, 'cause there's nothing to do
            else
              aStart++;
          }
          // this node has no meaning in the future list, so it's more than safe
          // to remove it, and check the next live node out instead, meaning
          // that only the live list index should be forwarded
          else
            parentNode.removeChild(get(a[aStart++], -1));
        }
      }
      return b;
    };

    const aria = node => values => {
      for (const key in values) {
        const name = key === 'role' ? key : `aria-${key}`;
        const value = values[key];
        if (value == null)
          node.removeAttribute(name);
        else
          node.setAttribute(name, value);
      }
    };

    const attribute = (node, name) => {
      let oldValue, orphan = true;
      const attributeNode = document.createAttributeNS(null, name);
      return newValue => {
        if (oldValue !== newValue) {
          oldValue = newValue;
          if (oldValue == null) {
            if (!orphan) {
              node.removeAttributeNode(attributeNode);
              orphan = true;
            }
          }
          else {
            const value = newValue;
            if (value == null) {
              if (!orphan)
                node.removeAttributeNode(attributeNode);
                orphan = true;
            }
            else {
              attributeNode.value = value;
              if (orphan) {
                node.setAttributeNodeNS(attributeNode);
                orphan = false;
              }
            }
          }
        }
      };
    };

    const boolean = (node, key, oldValue) => newValue => {
      if (oldValue !== !!newValue) {
        // when IE won't be around anymore ...
        // node.toggleAttribute(key, oldValue = !!newValue);
        if ((oldValue = !!newValue))
          node.setAttribute(key, '');
        else
          node.removeAttribute(key);
      }
    };

    const data = ({dataset}) => values => {
      for (const key in values) {
        const value = values[key];
        if (value == null)
          delete dataset[key];
        else
          dataset[key] = value;
      }
    };

    const event = (node, name) => {
      let oldValue, lower, type = name.slice(2);
      if (!(name in node) && (lower = name.toLowerCase()) in node)
        type = lower.slice(2);
      return newValue => {
        const info = isArray$1(newValue) ? newValue : [newValue, false];
        if (oldValue !== info[0]) {
          if (oldValue)
            node.removeEventListener(type, oldValue, info[1]);
          if (oldValue = info[0])
            node.addEventListener(type, oldValue, info[1]);
        }
      };
    };

    const ref = node => {
      let oldValue;
      return value => {
        if (oldValue !== value) {
          oldValue = value;
          if (typeof value === 'function')
            value(node);
          else
            value.current = node;
        }
      };
    };

    const setter = (node, key) => key === 'dataset' ?
      data(node) :
      value => {
        node[key] = value;
      };

    const text = node => {
      let oldValue;
      return newValue => {
        if (oldValue != newValue) {
          oldValue = newValue;
          node.textContent = newValue == null ? '' : newValue;
        }
      };
    };

    // from a generic path, retrieves the exact targeted node
    const reducePath = ({childNodes}, i) => childNodes[i];

    // this helper avoid code bloat around handleAnything() callback
    const diff = (comment, oldNodes, newNodes) => udomdiff(
      comment.parentNode,
      // TODO: there is a possible edge case where a node has been
      //       removed manually, or it was a keyed one, attached
      //       to a shared reference between renders.
      //       In this case udomdiff might fail at removing such node
      //       as its parent won't be the expected one.
      //       The best way to avoid this issue is to filter oldNodes
      //       in search of those not live, or not in the current parent
      //       anymore, but this would require both a change to uwire,
      //       exposing a parentNode from the firstChild, as example,
      //       but also a filter per each diff that should exclude nodes
      //       that are not in there, penalizing performance quite a lot.
      //       As this has been also a potential issue with domdiff,
      //       and both lighterhtml and hyperHTML might fail with this
      //       very specific edge case, I might as well document this possible
      //       "diffing shenanigan" and call it a day.
      oldNodes,
      newNodes,
      diffable,
      comment
    );

    // if an interpolation represents a comment, the whole
    // diffing will be related to such comment.
    // This helper is in charge of understanding how the new
    // content for such interpolation/hole should be updated
    const handleAnything = comment => {
      let oldValue, text, nodes = [];
      const anyContent = newValue => {
        switch (typeof newValue) {
          // primitives are handled as text content
          case 'string':
          case 'number':
          case 'boolean':
            if (oldValue !== newValue) {
              oldValue = newValue;
              if (!text)
                text = document.createTextNode('');
              text.data = newValue;
              nodes = diff(comment, nodes, [text]);
            }
            break;
          // null, and undefined are used to cleanup previous content
          case 'object':
          case 'undefined':
            if (newValue == null) {
              if (oldValue != newValue) {
                oldValue = newValue;
                nodes = diff(comment, nodes, []);
              }
              break;
            }
            // arrays and nodes have a special treatment
            if (isArray$1(newValue)) {
              oldValue = newValue;
              // arrays can be used to cleanup, if empty
              if (newValue.length === 0)
                nodes = diff(comment, nodes, []);
              // or diffed, if these contains nodes or "wires"
              else if (typeof newValue[0] === 'object')
                nodes = diff(comment, nodes, newValue);
              // in all other cases the content is stringified as is
              else
                anyContent(String(newValue));
              break;
            }
            // if the new value is a DOM node, or a wire, and it's
            // different from the one already live, then it's diffed.
            // if the node is a fragment, it's appended once via its childNodes
            // There is no `else` here, meaning if the content
            // is not expected one, nothing happens, as easy as that.
            if (oldValue !== newValue && 'ELEMENT_NODE' in newValue) {
              oldValue = newValue;
              nodes = diff(
                comment,
                nodes,
                newValue.nodeType === 11 ?
                  slice.call(newValue.childNodes) :
                  [newValue]
              );
            }
            break;
          case 'function':
            anyContent(newValue(comment));
            break;
        }
      };
      return anyContent;
    };

    // attributes can be:
    //  * ref=${...}      for hooks and other purposes
    //  * aria=${...}     for aria attributes
    //  * ?boolean=${...} for boolean attributes
    //  * .dataset=${...} for dataset related attributes
    //  * .setter=${...}  for Custom Elements setters or nodes with setters
    //                    such as buttons, details, options, select, etc
    //  * @event=${...}   to explicitly handle event listeners
    //  * onevent=${...}  to automatically handle event listeners
    //  * generic=${...}  to handle an attribute just like an attribute
    const handleAttribute = (node, name/*, svg*/) => {
      switch (name[0]) {
        case '?': return boolean(node, name.slice(1), false);
        case '.': return setter(node, name.slice(1));
        case '@': return event(node, 'on' + name.slice(1));
        case 'o': if (name[1] === 'n') return event(node, name);
      }

      switch (name) {
        case 'ref': return ref(node);
        case 'aria': return aria(node);
      }

      return attribute(node, name/*, svg*/);
    };

    // each mapped update carries the update type and its path
    // the type is either node, attribute, or text, while
    // the path is how to retrieve the related node to update.
    // In the attribute case, the attribute name is also carried along.
    function handlers(options) {
      const {type, path} = options;
      const node = path.reduceRight(reducePath, this);
      return type === 'node' ?
        handleAnything(node) :
        (type === 'attr' ?
          handleAttribute(node, options.name/*, options.svg*/) :
          text(node));
    }

    /*! (c) Andrea Giammarchi - ISC */
    var createContent = (function (document) {  var FRAGMENT = 'fragment';
      var TEMPLATE = 'template';
      var HAS_CONTENT = 'content' in create(TEMPLATE);

      var createHTML = HAS_CONTENT ?
        function (html) {
          var template = create(TEMPLATE);
          template.innerHTML = html;
          return template.content;
        } :
        function (html) {
          var content = create(FRAGMENT);
          var template = create(TEMPLATE);
          var childNodes = null;
          if (/^[^\S]*?<(col(?:group)?|t(?:head|body|foot|r|d|h))/i.test(html)) {
            var selector = RegExp.$1;
            template.innerHTML = '<table>' + html + '</table>';
            childNodes = template.querySelectorAll(selector);
          } else {
            template.innerHTML = html;
            childNodes = template.childNodes;
          }
          append(content, childNodes);
          return content;
        };

      return function createContent(markup, type) {
        return (type === 'svg' ? createSVG : createHTML)(markup);
      };

      function append(root, childNodes) {
        var length = childNodes.length;
        while (length--)
          root.appendChild(childNodes[0]);
      }

      function create(element) {
        return element === FRAGMENT ?
          document.createDocumentFragment() :
          document.createElementNS('http://www.w3.org/1999/xhtml', element);
      }

      // it could use createElementNS when hasNode is there
      // but this fallback is equally fast and easier to maintain
      // it is also battle tested already in all IE
      function createSVG(svg) {
        var content = create(FRAGMENT);
        var template = create('div');
        template.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg">' + svg + '</svg>';
        append(content, template.firstChild.childNodes);
        return content;
      }

    }(document));

    // this "hack" tells the library if the browser is IE11 or old Edge
    const isImportNodeLengthWrong = document.importNode.length != 1;

    // IE11 and old Edge discard empty nodes when cloning, potentially
    // resulting in broken paths to find updates. The workaround here
    // is to import once, upfront, the fragment that will be cloned
    // later on, so that paths are retrieved from one already parsed,
    // hence without missing child nodes once re-cloned.
    const createFragment = isImportNodeLengthWrong ?
      (text, type, normalize) => document.importNode(
        createContent(text, type, normalize),
        true
      ) :
      createContent;

    // IE11 and old Edge have a different createTreeWalker signature that
    // has been deprecated in other browsers. This export is needed only
    // to guarantee the TreeWalker doesn't show warnings and, ultimately, works
    const createWalker = isImportNodeLengthWrong ?
      fragment => document.createTreeWalker(fragment, 1 | 128, null, false) :
      fragment => document.createTreeWalker(fragment, 1 | 128);

    // from a fragment container, create an array of indexes
    // related to its child nodes, so that it's possible
    // to retrieve later on exact node via reducePath
    const createPath = node => {
      const path = [];
      let {parentNode} = node;
      while (parentNode) {
        path.push(indexOf.call(parentNode.childNodes, node));
        node = parentNode;
        parentNode = node.parentNode;
      }
      return path;
    };

    // the prefix is used to identify either comments, attributes, or nodes
    // that contain the related unique id. In the attribute cases
    // isµX="attribute-name" will be used to map current X update to that
    // attribute name, while comments will be like <!--isµX-->, to map
    // the update to that specific comment node, hence its parent.
    // style and textarea will have <!--isµX--> text content, and are handled
    // directly through text-only updates.
    const prefix = 'isµ';

    // Template Literals are unique per scope and static, meaning a template
    // should be parsed once, and once only, as it will always represent the same
    // content, within the exact same amount of updates each time.
    // This cache relates each template to its unique content and updates.
    const cache$1 = umap(new WeakMap);

    // a RegExp that helps checking nodes that cannot contain comments
    const textOnly = /^(?:plaintext|script|style|textarea|title|xmp)$/i;

    const createCache = () => ({
      stack: [],    // each template gets a stack for each interpolation "hole"

      entry: null,  // each entry contains details, such as:
                    //  * the template that is representing
                    //  * the type of node it represents (html or svg)
                    //  * the content fragment with all nodes
                    //  * the list of updates per each node (template holes)
                    //  * the "wired" node or fragment that will get updates
                    // if the template or type are different from the previous one
                    // the entry gets re-created each time

      wire: null    // each rendered node represent some wired content and
                    // this reference to the latest one. If different, the node
                    // will be cleaned up and the new "wire" will be appended
    });

    // the entry stored in the rendered node cache, and per each "hole"
    const createEntry = (type, template) => {
      const {content, updates} = mapUpdates(type, template);
      return {type, template, content, updates, wire: null};
    };

    // a template is instrumented to be able to retrieve where updates are needed.
    // Each unique template becomes a fragment, cloned once per each other
    // operation based on the same template, i.e. data => html`<p>${data}</p>`
    const mapTemplate = (type, template) => {
      const text = instrument(template, prefix, type === 'svg');
      const content = createFragment(text, type);
      // once instrumented and reproduced as fragment, it's crawled
      // to find out where each update is in the fragment tree
      const tw = createWalker(content);
      const nodes = [];
      const length = template.length - 1;
      let i = 0;
      // updates are searched via unique names, linearly increased across the tree
      // <div isµ0="attr" isµ1="other"><!--isµ2--><style><!--isµ3--</style></div>
      let search = `${prefix}${i}`;
      while (i < length) {
        const node = tw.nextNode();
        // if not all updates are bound but there's nothing else to crawl
        // it means that there is something wrong with the template.
        if (!node)
          throw `bad template: ${text}`;
        // if the current node is a comment, and it contains isµX
        // it means the update should take care of any content
        if (node.nodeType === 8) {
          // The only comments to be considered are those
          // which content is exactly the same as the searched one.
          if (node.data === search) {
            nodes.push({type: 'node', path: createPath(node)});
            search = `${prefix}${++i}`;
          }
        }
        else {
          // if the node is not a comment, loop through all its attributes
          // named isµX and relate attribute updates to this node and the
          // attribute name, retrieved through node.getAttribute("isµX")
          // the isµX attribute will be removed as irrelevant for the layout
          // let svg = -1;
          while (node.hasAttribute(search)) {
            nodes.push({
              type: 'attr',
              path: createPath(node),
              name: node.getAttribute(search),
              //svg: svg < 0 ? (svg = ('ownerSVGElement' in node ? 1 : 0)) : svg
            });
            node.removeAttribute(search);
            search = `${prefix}${++i}`;
          }
          // if the node was a style, textarea, or others, check its content
          // and if it is <!--isµX--> then update tex-only this node
          if (
            textOnly.test(node.tagName) &&
            node.textContent.trim() === `<!--${search}-->`
          ){
            node.textContent = '';
            nodes.push({type: 'text', path: createPath(node)});
            search = `${prefix}${++i}`;
          }
        }
      }
      // once all nodes to update, or their attributes, are known, the content
      // will be cloned in the future to represent the template, and all updates
      // related to such content retrieved right away without needing to re-crawl
      // the exact same template, and its content, more than once.
      return {content, nodes};
    };

    // if a template is unknown, perform the previous mapping, otherwise grab
    // its details such as the fragment with all nodes, and updates info.
    const mapUpdates = (type, template) => {
      const {content, nodes} = (
        cache$1.get(template) ||
        cache$1.set(template, mapTemplate(type, template))
      );
      // clone deeply the fragment
      const fragment = document.importNode(content, true);
      // and relate an update handler per each node that needs one
      const updates = nodes.map(handlers, fragment);
      // return the fragment and all updates to use within its nodes
      return {content: fragment, updates};
    };

    // as html and svg can be nested calls, but no parent node is known
    // until rendered somewhere, the unroll operation is needed to
    // discover what to do with each interpolation, which will result
    // into an update operation.
    const unroll = (info, {type, template, values}) => {
      const {length} = values;
      // interpolations can contain holes and arrays, so these need
      // to be recursively discovered
      unrollValues(info, values, length);
      let {entry} = info;
      // if the cache entry is either null or different from the template
      // and the type this unroll should resolve, create a new entry
      // assigning a new content fragment and the list of updates.
      if (!entry || (entry.template !== template || entry.type !== type))
        info.entry = (entry = createEntry(type, template));
      const {content, updates, wire} = entry;
      // even if the fragment and its nodes is not live yet,
      // it is already possible to update via interpolations values.
      for (let i = 0; i < length; i++)
        updates[i](values[i]);
      // if the entry was new, or representing a different template or type,
      // create a new persistent entity to use during diffing.
      // This is simply a DOM node, when the template has a single container,
      // as in `<p></p>`, or a "wire" in `<p></p><p></p>` and similar cases.
      return wire || (entry.wire = persistent(content));
    };

    // the stack retains, per each interpolation value, the cache
    // related to each interpolation value, or null, if the render
    // was conditional and the value is not special (Array or Hole)
    const unrollValues = ({stack}, values, length) => {
      for (let i = 0; i < length; i++) {
        const hole = values[i];
        // each Hole gets unrolled and re-assigned as value
        // so that domdiff will deal with a node/wire, not with a hole
        if (hole instanceof Hole)
          values[i] = unroll(
            stack[i] || (stack[i] = createCache()),
            hole
          );
        // arrays are recursively resolved so that each entry will contain
        // also a DOM node or a wire, hence it can be diffed if/when needed
        else if (isArray$1(hole))
          unrollValues(
            stack[i] || (stack[i] = createCache()),
            hole,
            hole.length
          );
        // if the value is nothing special, the stack doesn't need to retain data
        // this is useful also to cleanup previously retained data, if the value
        // was a Hole, or an Array, but not anymore, i.e.:
        // const update = content => html`<div>${content}</div>`;
        // update(listOfItems); update(null); update(html`hole`)
        else
          stack[i] = null;
      }
      if (length < stack.length)
        stack.splice(length);
    };

    /**
     * Holds all details wrappers needed to render the content further on.
     * @constructor
     * @param {string} type The hole type, either `html` or `svg`.
     * @param {string[]} template The template literals used to the define the content.
     * @param {Array} values Zero, one, or more interpolated values to render.
     */
    function Hole(type, template, values) {
      this.type = type;
      this.template = template;
      this.values = values;
    }

    const {create, defineProperties: defineProperties$1} = Object;

    // both `html` and `svg` template literal tags are polluted
    // with a `for(ref[, id])` and a `node` tag too
    const tag$1 = type => {
      // both `html` and `svg` tags have their own cache
      const keyed = umap(new WeakMap);
      // keyed operations always re-use the same cache and unroll
      // the template and its interpolations right away
      const fixed = cache => (template, ...values) => unroll(
        cache,
        {type, template, values}
      );
      return defineProperties$1(
        // non keyed operations are recognized as instance of Hole
        // during the "unroll", recursively resolved and updated
        (template, ...values) => new Hole(type, template, values),
        {
          for: {
            // keyed operations need a reference object, usually the parent node
            // which is showing keyed results, and optionally a unique id per each
            // related node, handy with JSON results and mutable list of objects
            // that usually carry a unique identifier
            value(ref, id) {
              const memo = keyed.get(ref) || keyed.set(ref, create(null));
              return memo[id] || (memo[id] = fixed(createCache()));
            }
          },
          node: {
            // it is possible to create one-off content out of the box via node tag
            // this might return the single created node, or a fragment with all
            // nodes present at the root level and, of course, their child nodes
            value: (template, ...values) => unroll(
              createCache(),
              {type, template, values}
            ).valueOf()
          }
        }
      );
    };

    // each rendered node gets its own cache
    const cache = umap(new WeakMap);

    // rendering means understanding what `html` or `svg` tags returned
    // and it relates a specific node to its own unique cache.
    // Each time the content to render changes, the node is cleaned up
    // and the new new content is appended, and if such content is a Hole
    // then it's "unrolled" to resolve all its inner nodes.
    const render$1 = (where, what) => {
      const hole = typeof what === 'function' ? what() : what;
      const info = cache.get(where) || cache.set(where, createCache());
      const wire = hole instanceof Hole ? unroll(info, hole) : hole;
      if (wire !== info.wire) {
        info.wire = wire;
        where.textContent = '';
        // valueOf() simply returns the node itself, but in case it was a "wire"
        // it will eventually re-append all nodes to its fragment so that such
        // fragment can be re-appended many times in a meaningful way
        // (wires are basically persistent fragments facades with special behavior)
        where.appendChild(wire.valueOf());
      }
      return where;
    };

    const html$1 = tag$1('html');
    const svg = tag$1('svg');

    const {isArray} = Array;

    const sync = (values, i) => {
      const resolved = [];
      for (const {length} = values; i < length; i++)
        resolved.push(isArray(values[i]) ? sync(values[i], 0) : values[i]);
      return Promise.all(resolved);
    };

    /**
     * Returns a template literal tag abe to resolve, recursively, any possible
     * asynchronous interpolation.
     * @param {function} tag a template literal tag.
     * @returns {function} a template literal tag that resolves interpolations
     *                     before passing these to the initial template literal.
     */
    var asyncTag = tag => {
      function invoke(template, values) {
        return tag.apply(this, [template].concat(values));
      }
      return function (template) {
        return sync(arguments, 1).then(invoke.bind(this, template));
      };
    };

    const {defineProperties} = Object;

    const tag = original => {
      const wrap = umap(new WeakMap);
      return defineProperties(
        asyncTag(original),
        {
          for: {
            value(ref, id) {
              const tag = original.for(ref, id);
              return wrap.get(tag) || wrap.set(tag, asyncTag(tag));
            }
          },
          node: {
            value: asyncTag(original.node)
          }
        }
      );
    };

    const html = tag(html$1);
    tag(svg);

    const render = (where, what) => {
      const hole = typeof what === 'function' ? what() : what;
      return Promise.resolve(hole).then(what => render$1(where, what));
    };

    /*
     * quantize.js Copyright 2008 Nick Rabinowitz
     * Ported to node.js by Olivier Lesnicki
     * Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
     */
    // fill out a couple protovis dependencies
    /*
     * Block below copied from Protovis: http://mbostock.github.com/protovis/
     * Copyright 2010 Stanford Visualization Group
     * Licensed under the BSD License: http://www.opensource.org/licenses/bsd-license.php
     */
    if (!pv) {
        var pv = {
            map: function(array, f) {
                var o = {};
                return f ? array.map(function(d, i) {
                    o.index = i;
                    return f.call(o, d);
                }) : array.slice();
            },
            naturalOrder: function(a, b) {
                return (a < b) ? -1 : ((a > b) ? 1 : 0);
            },
            sum: function(array, f) {
                var o = {};
                return array.reduce(f ? function(p, d, i) {
                    o.index = i;
                    return p + f.call(o, d);
                } : function(p, d) {
                    return p + d;
                }, 0);
            },
            max: function(array, f) {
                return Math.max.apply(null, f ? pv.map(array, f) : array);
            }
        };
    }

    /**
     * Basic Javascript port of the MMCQ (modified median cut quantization)
     * algorithm from the Leptonica library (http://www.leptonica.com/).
     * Returns a color map you can use to map original pixels to the reduced
     * palette. Still a work in progress.
     * 
     * @author Nick Rabinowitz
     * @example
     
    // array of pixels as [R,G,B] arrays
    var myPixels = [[190,197,190], [202,204,200], [207,214,210], [211,214,211], [205,207,207]
                    // etc
                    ];
    var maxColors = 4;
     
    var cmap = MMCQ.quantize(myPixels, maxColors);
    var newPalette = cmap.palette();
    var newPixels = myPixels.map(function(p) { 
        return cmap.map(p); 
    });
     
     */
    var MMCQ = (function() {
        // private constants
        var sigbits = 5,
            rshift = 8 - sigbits,
            maxIterations = 1000,
            fractByPopulations = 0.75;

        // get reduced-space color index for a pixel

        function getColorIndex(r, g, b) {
            return (r << (2 * sigbits)) + (g << sigbits) + b;
        }

        // Simple priority queue

        function PQueue(comparator) {
            var contents = [],
                sorted = false;

            function sort() {
                contents.sort(comparator);
                sorted = true;
            }

            return {
                push: function(o) {
                    contents.push(o);
                    sorted = false;
                },
                peek: function(index) {
                    if (!sorted) sort();
                    if (index === undefined) index = contents.length - 1;
                    return contents[index];
                },
                pop: function() {
                    if (!sorted) sort();
                    return contents.pop();
                },
                size: function() {
                    return contents.length;
                },
                map: function(f) {
                    return contents.map(f);
                },
                debug: function() {
                    if (!sorted) sort();
                    return contents;
                }
            };
        }

        // 3d color space box

        function VBox(r1, r2, g1, g2, b1, b2, histo) {
            var vbox = this;
            vbox.r1 = r1;
            vbox.r2 = r2;
            vbox.g1 = g1;
            vbox.g2 = g2;
            vbox.b1 = b1;
            vbox.b2 = b2;
            vbox.histo = histo;
        }
        VBox.prototype = {
            volume: function(force) {
                var vbox = this;
                if (!vbox._volume || force) {
                    vbox._volume = ((vbox.r2 - vbox.r1 + 1) * (vbox.g2 - vbox.g1 + 1) * (vbox.b2 - vbox.b1 + 1));
                }
                return vbox._volume;
            },
            count: function(force) {
                var vbox = this,
                    histo = vbox.histo;
                if (!vbox._count_set || force) {
                    var npix = 0,
                        i, j, k, index;
                    for (i = vbox.r1; i <= vbox.r2; i++) {
                        for (j = vbox.g1; j <= vbox.g2; j++) {
                            for (k = vbox.b1; k <= vbox.b2; k++) {
                                index = getColorIndex(i, j, k);
                                npix += (histo[index] || 0);
                            }
                        }
                    }
                    vbox._count = npix;
                    vbox._count_set = true;
                }
                return vbox._count;
            },
            copy: function() {
                var vbox = this;
                return new VBox(vbox.r1, vbox.r2, vbox.g1, vbox.g2, vbox.b1, vbox.b2, vbox.histo);
            },
            avg: function(force) {
                var vbox = this,
                    histo = vbox.histo;
                if (!vbox._avg || force) {
                    var ntot = 0,
                        mult = 1 << (8 - sigbits),
                        rsum = 0,
                        gsum = 0,
                        bsum = 0,
                        hval,
                        i, j, k, histoindex;
                    for (i = vbox.r1; i <= vbox.r2; i++) {
                        for (j = vbox.g1; j <= vbox.g2; j++) {
                            for (k = vbox.b1; k <= vbox.b2; k++) {
                                histoindex = getColorIndex(i, j, k);
                                hval = histo[histoindex] || 0;
                                ntot += hval;
                                rsum += (hval * (i + 0.5) * mult);
                                gsum += (hval * (j + 0.5) * mult);
                                bsum += (hval * (k + 0.5) * mult);
                            }
                        }
                    }
                    if (ntot) {
                        vbox._avg = [~~(rsum / ntot), ~~ (gsum / ntot), ~~ (bsum / ntot)];
                    } else {
                        //console.log('empty box');
                        vbox._avg = [~~(mult * (vbox.r1 + vbox.r2 + 1) / 2), ~~ (mult * (vbox.g1 + vbox.g2 + 1) / 2), ~~ (mult * (vbox.b1 + vbox.b2 + 1) / 2)];
                    }
                }
                return vbox._avg;
            },
            contains: function(pixel) {
                var vbox = this,
                    rval = pixel[0] >> rshift;
                gval = pixel[1] >> rshift;
                bval = pixel[2] >> rshift;
                return (rval >= vbox.r1 && rval <= vbox.r2 &&
                    gval >= vbox.g1 && gval <= vbox.g2 &&
                    bval >= vbox.b1 && bval <= vbox.b2);
            }
        };

        // Color map

        function CMap() {
            this.vboxes = new PQueue(function(a, b) {
                return pv.naturalOrder(
                    a.vbox.count() * a.vbox.volume(),
                    b.vbox.count() * b.vbox.volume()
                )
            });    }
        CMap.prototype = {
            push: function(vbox) {
                this.vboxes.push({
                    vbox: vbox,
                    color: vbox.avg()
                });
            },
            palette: function() {
                return this.vboxes.map(function(vb) {
                    return vb.color
                });
            },
            size: function() {
                return this.vboxes.size();
            },
            map: function(color) {
                var vboxes = this.vboxes;
                for (var i = 0; i < vboxes.size(); i++) {
                    if (vboxes.peek(i).vbox.contains(color)) {
                        return vboxes.peek(i).color;
                    }
                }
                return this.nearest(color);
            },
            nearest: function(color) {
                var vboxes = this.vboxes,
                    d1, d2, pColor;
                for (var i = 0; i < vboxes.size(); i++) {
                    d2 = Math.sqrt(
                        Math.pow(color[0] - vboxes.peek(i).color[0], 2) +
                        Math.pow(color[1] - vboxes.peek(i).color[1], 2) +
                        Math.pow(color[2] - vboxes.peek(i).color[2], 2)
                    );
                    if (d2 < d1 || d1 === undefined) {
                        d1 = d2;
                        pColor = vboxes.peek(i).color;
                    }
                }
                return pColor;
            },
            forcebw: function() {
                // XXX: won't  work yet
                var vboxes = this.vboxes;
                vboxes.sort(function(a, b) {
                    return pv.naturalOrder(pv.sum(a.color), pv.sum(b.color))
                });

                // force darkest color to black if everything < 5
                var lowest = vboxes[0].color;
                if (lowest[0] < 5 && lowest[1] < 5 && lowest[2] < 5)
                    vboxes[0].color = [0, 0, 0];

                // force lightest color to white if everything > 251
                var idx = vboxes.length - 1,
                    highest = vboxes[idx].color;
                if (highest[0] > 251 && highest[1] > 251 && highest[2] > 251)
                    vboxes[idx].color = [255, 255, 255];
            }
        };

        // histo (1-d array, giving the number of pixels in
        // each quantized region of color space), or null on error

        function getHisto(pixels) {
            var histosize = 1 << (3 * sigbits),
                histo = new Array(histosize),
                index, rval, gval, bval;
            pixels.forEach(function(pixel) {
                rval = pixel[0] >> rshift;
                gval = pixel[1] >> rshift;
                bval = pixel[2] >> rshift;
                index = getColorIndex(rval, gval, bval);
                histo[index] = (histo[index] || 0) + 1;
            });
            return histo;
        }

        function vboxFromPixels(pixels, histo) {
            var rmin = 1000000,
                rmax = 0,
                gmin = 1000000,
                gmax = 0,
                bmin = 1000000,
                bmax = 0,
                rval, gval, bval;
            // find min/max
            pixels.forEach(function(pixel) {
                rval = pixel[0] >> rshift;
                gval = pixel[1] >> rshift;
                bval = pixel[2] >> rshift;
                if (rval < rmin) rmin = rval;
                else if (rval > rmax) rmax = rval;
                if (gval < gmin) gmin = gval;
                else if (gval > gmax) gmax = gval;
                if (bval < bmin) bmin = bval;
                else if (bval > bmax) bmax = bval;
            });
            return new VBox(rmin, rmax, gmin, gmax, bmin, bmax, histo);
        }

        function medianCutApply(histo, vbox) {
            if (!vbox.count()) return;

            var rw = vbox.r2 - vbox.r1 + 1,
                gw = vbox.g2 - vbox.g1 + 1,
                bw = vbox.b2 - vbox.b1 + 1,
                maxw = pv.max([rw, gw, bw]);
            // only one pixel, no split
            if (vbox.count() == 1) {
                return [vbox.copy()]
            }
            /* Find the partial sum arrays along the selected axis. */
            var total = 0,
                partialsum = [],
                lookaheadsum = [],
                i, j, k, sum, index;
            if (maxw == rw) {
                for (i = vbox.r1; i <= vbox.r2; i++) {
                    sum = 0;
                    for (j = vbox.g1; j <= vbox.g2; j++) {
                        for (k = vbox.b1; k <= vbox.b2; k++) {
                            index = getColorIndex(i, j, k);
                            sum += (histo[index] || 0);
                        }
                    }
                    total += sum;
                    partialsum[i] = total;
                }
            } else if (maxw == gw) {
                for (i = vbox.g1; i <= vbox.g2; i++) {
                    sum = 0;
                    for (j = vbox.r1; j <= vbox.r2; j++) {
                        for (k = vbox.b1; k <= vbox.b2; k++) {
                            index = getColorIndex(j, i, k);
                            sum += (histo[index] || 0);
                        }
                    }
                    total += sum;
                    partialsum[i] = total;
                }
            } else { /* maxw == bw */
                for (i = vbox.b1; i <= vbox.b2; i++) {
                    sum = 0;
                    for (j = vbox.r1; j <= vbox.r2; j++) {
                        for (k = vbox.g1; k <= vbox.g2; k++) {
                            index = getColorIndex(j, k, i);
                            sum += (histo[index] || 0);
                        }
                    }
                    total += sum;
                    partialsum[i] = total;
                }
            }
            partialsum.forEach(function(d, i) {
                lookaheadsum[i] = total - d;
            });

            function doCut(color) {
                var dim1 = color + '1',
                    dim2 = color + '2',
                    left, right, vbox1, vbox2, d2, count2 = 0;
                for (i = vbox[dim1]; i <= vbox[dim2]; i++) {
                    if (partialsum[i] > total / 2) {
                        vbox1 = vbox.copy();
                        vbox2 = vbox.copy();
                        left = i - vbox[dim1];
                        right = vbox[dim2] - i;
                        if (left <= right)
                            d2 = Math.min(vbox[dim2] - 1, ~~ (i + right / 2));
                        else d2 = Math.max(vbox[dim1], ~~ (i - 1 - left / 2));
                        // avoid 0-count boxes
                        while (!partialsum[d2]) d2++;
                        count2 = lookaheadsum[d2];
                        while (!count2 && partialsum[d2 - 1]) count2 = lookaheadsum[--d2];
                        // set dimensions
                        vbox1[dim2] = d2;
                        vbox2[dim1] = vbox1[dim2] + 1;
                        // console.log('vbox counts:', vbox.count(), vbox1.count(), vbox2.count());
                        return [vbox1, vbox2];
                    }
                }

            }
            // determine the cut planes
            return maxw == rw ? doCut('r') :
                maxw == gw ? doCut('g') :
                doCut('b');
        }

        function quantize(pixels, maxcolors) {
            // short-circuit
            if (!pixels.length || maxcolors < 2 || maxcolors > 256) {
                // console.log('wrong number of maxcolors');
                return false;
            }

            // XXX: check color content and convert to grayscale if insufficient

            var histo = getHisto(pixels);
            histo.forEach(function() {
            });

            // get the beginning vbox from the colors
            var vbox = vboxFromPixels(pixels, histo),
                pq = new PQueue(function(a, b) {
                    return pv.naturalOrder(a.count(), b.count())
                });
            pq.push(vbox);

            // inner function to do the iteration

            function iter(lh, target) {
                var ncolors = 1,
                    niters = 0,
                    vbox;
                while (niters < maxIterations) {
                    vbox = lh.pop();
                    if (!vbox.count()) { /* just put it back */
                        lh.push(vbox);
                        niters++;
                        continue;
                    }
                    // do the cut
                    var vboxes = medianCutApply(histo, vbox),
                        vbox1 = vboxes[0],
                        vbox2 = vboxes[1];

                    if (!vbox1) {
                        // console.log("vbox1 not defined; shouldn't happen!");
                        return;
                    }
                    lh.push(vbox1);
                    if (vbox2) { /* vbox2 can be null */
                        lh.push(vbox2);
                        ncolors++;
                    }
                    if (ncolors >= target) return;
                    if (niters++ > maxIterations) {
                        // console.log("infinite loop; perhaps too few pixels!");
                        return;
                    }
                }
            }

            // first set of colors, sorted by population
            iter(pq, fractByPopulations * maxcolors);
            // console.log(pq.size(), pq.debug().length, pq.debug().slice());

            // Re-sort by the product of pixel occupancy times the size in color space.
            var pq2 = new PQueue(function(a, b) {
                return pv.naturalOrder(a.count() * a.volume(), b.count() * b.volume())
            });
            while (pq.size()) {
                pq2.push(pq.pop());
            }

            // next set - generate the median cuts using the (npix * vol) sorting.
            iter(pq2, maxcolors - pq2.size());

            // calculate the actual colors
            var cmap = new CMap();
            while (pq2.size()) {
                cmap.push(pq2.pop());
            }

            return cmap;
        }

        return {
            quantize: quantize
        }
    })();

    var quantize = MMCQ.quantize;

    function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
      try {
        var info = gen[key](arg);
        var value = info.value;
      } catch (error) {
        reject(error);
        return;
      }

      if (info.done) {
        resolve(value);
      } else {
        Promise.resolve(value).then(_next, _throw);
      }
    }

    function _asyncToGenerator(fn) {
      return function () {
        var self = this,
            args = arguments;
        return new Promise(function (resolve, reject) {
          var gen = fn.apply(self, args);

          function _next(value) {
            asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
          }

          function _throw(err) {
            asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
          }

          _next(undefined);
        });
      };
    }

    function _extends() {
      _extends = Object.assign || function (target) {
        for (var i = 1; i < arguments.length; i++) {
          var source = arguments[i];

          for (var key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
              target[key] = source[key];
            }
          }
        }

        return target;
      };

      return _extends.apply(this, arguments);
    }

    function _taggedTemplateLiteralLoose(strings, raw) {
      if (!raw) {
        raw = strings.slice(0);
      }

      strings.raw = raw;
      return strings;
    }

    function peg$subclass(t, r) {
      function e() {
        this.constructor = t;
      }

      e.prototype = r.prototype, t.prototype = new e();
    }

    function peg$SyntaxError(t, r, e, n) {
      this.message = t, this.expected = r, this.found = e, this.location = n, this.name = "SyntaxError", "function" == typeof Error.captureStackTrace && Error.captureStackTrace(this, peg$SyntaxError);
    }

    function peg$parse(t, r) {
      r = void 0 !== r ? r : {};

      var e,
          n = {},
          u = {
        turtleDoc: qe
      },
          s = qe,
          a = function a(t) {
        var r = vn.toJSON();
        return r["@graph"] = [], t.filter(t => Array.isArray(t)).forEach(t => {
          t.forEach(t => {
            r["@graph"].push(t);
          });
        }), 1 === r["@graph"].length && (Object.assign(r, r["@graph"][0]), delete r["@graph"]), r;
      },
          c = ".",
          o = ke(".", !1),
          f = function f(t) {
        return t;
      },
          i = "#",
          h = ke("#", !1),
          l = /^[^\n]/,
          A = Be(["\n"], !0, !1),
          p = "\n",
          d = ke("\n", !1),
          g = function g(t) {
        return t.join("");
      },
          v = "@prefix",
          w = ke("@prefix", !1),
          b = function b(t, r) {
        return vn.addPrefix("" === t ? "0" : t, r), {};
      },
          C = "@base",
          x = ke("@base", !1),
          F = function F(t) {
        return vn.addBase(t), {};
      },
          y = /^[Bb]/,
          m = Be(["B", "b"], !1, !1),
          S = /^[Aa]/,
          j = Be(["A", "a"], !1, !1),
          E = /^[Ss]/,
          I = Be(["S", "s"], !1, !1),
          $ = /^[Ee]/,
          D = Be(["E", "e"], !1, !1),
          L = /^[Pp]/,
          M = Be(["P", "p"], !1, !1),
          R = /^[Rr]/,
          X = Be(["R", "r"], !1, !1),
          O = /^[Ff]/,
          P = Be(["F", "f"], !1, !1),
          z = /^[Ii]/,
          Z = Be(["I", "i"], !1, !1),
          _ = /^[Xx]/,
          k = Be(["X", "x"], !1, !1),
          B = function B(t, r) {
        var e = {};
        return "string" == typeof t && "[]" !== t ? e["@id"] = t : "object" == typeof t && Object.assign(e, t), r && Object.assign(e, r), [e];
      },
          U = function U(t, r) {
        var e = {};
        return t && Object.assign(e, t), r && Object.assign(e, r), [e];
      },
          J = ";",
          N = ke(";", !1),
          T = function T(t, r, e, n) {
        var u = {};
        return u[e] = n, u;
      },
          q = function q(t, r, e) {
        return e;
      },
          G = function G(t, r, e) {
        var n = {};
        return e.unshift(function (t, r) {
          var e = {};
          return e[t] = r, e;
        }(t, r)), e.forEach(t => {
          t && Object.keys(t).forEach(r => {
            t[r].forEach(t => {
              "@type" === r && void 0 !== t["@id"] && (t = t["@id"]), void 0 === n[r] ? n[r] = t : Array.isArray(n[r]) ? n[r].push(t) : n[r] = [n[r], t];
            });
          });
        }), n;
      },
          H = ",",
          K = ke(",", !1),
          Q = function Q(t, r) {
        return r;
      },
          V = function V(t, r) {
        return r.unshift(t), r;
      },
          W = "a",
          Y = ke("a", !1),
          tt = function tt() {
        return "@type";
      },
          rt = function rt(t) {
        return wn(t, !0);
      },
          et = function et(t) {
        return wn(t, !1);
      },
          nt = function nt(t) {
        return "[]" === t ? {} : {
          "@id": t
        };
      },
          ut = function ut(t) {
        return {
          "@id": t
        };
      },
          st = "[",
          at = ke("[", !1),
          ct = "]",
          ot = ke("]", !1),
          ft = "(",
          it = ke("(", !1),
          ht = ")",
          lt = ke(")", !1),
          At = function At(t) {
        return {
          "@list": t
        };
      },
          pt = function pt(t, r) {
        return {
          "@value": t,
          "@language": r
        };
      },
          dt = "^^",
          gt = ke("^^", !1),
          vt = function vt(t, r) {
        if ("http://www.w3.org/2001/XMLSchema#boolean" === r && "true" === t) return !0;
        if ("http://www.w3.org/2001/XMLSchema#boolean" === r && "false" === t) return !1;
        if ("http://www.w3.org/2001/XMLSchema#integer" === r) return parseInt(t);
        if ("http://www.w3.org/2001/XMLSchema#double" === r) return parseFloat(t);
        var e = vn.resolve(r, !0);

        if (e) {
          var _n = r.split(":")[0];
          if ("http://www.w3.org/2001/XMLSchema#boolean" === e && "true" === t) return vn.decrement(_n), !0;
          if ("http://www.w3.org/2001/XMLSchema#boolean" === e && "false" === t) return vn.decrement(_n), !1;
          if ("http://www.w3.org/2001/XMLSchema#integer" === e) return vn.decrement(_n), parseInt(t);
          if ("http://www.w3.org/2001/XMLSchema#double" === e) return vn.decrement(_n), parseFloat(t);
        }

        return {
          "@value": t,
          "@type": r
        };
      },
          wt = "true",
          bt = ke("true", !1),
          Ct = function Ct() {
        return !0;
      },
          xt = "false",
          Ft = ke("false", !1),
          yt = function yt() {
        return !1;
      },
          mt = function mt(t) {
        return t + ":";
      },
          St = "<",
          jt = ke("<", !1),
          Et = /^[^\0- <>"{}|\^`\\]/,
          It = Be([["\0", " "], "<", ">", '"', "{", "}", "|", "^", "`", "\\"], !0, !1),
          $t = ">",
          Dt = ke(">", !1),
          Lt = function Lt(t) {
        var r = t.map(t => 65536 <= t.codePointAt(0) && t.codePointAt(0) <= 983039 ? "a" : 1 === t.length ? t : 6 === t.length ? String.fromCharCode("0x" + t.substring(2)) : 10 === t.length ? String.fromCodePoint("0x" + t.substring(2)) : t).join("");

        if (r.match(/^[^\u0000-\u0020<>"{}|^`\\]*$/)) {
          var e = t.join("");

          try {
            return vn.resolve(e);
          } catch (t) {
            _e("Invalid IRIREF " + e);
          }
        } else _e("Invalid IRIREF " + t.join("") + " / " + r);
      },
          Mt = ":",
          Rt = ke(":", !1),
          Xt = function Xt(t) {
        return t = t || "0", !1 === vn.hasPrefix(t) && _e("undefined prefix " + t), t;
      },
          Ot = function Ot(t) {
        return t || "";
      },
          Pt = function Pt(t, r) {
        return vn.increment(t), vn.resolve(t + ":" + r);
      },
          zt = "_:",
          Zt = ke("_:", !1),
          _t = /^[0-9]/,
          kt = Be([["0", "9"]], !1, !1),
          Bt = "@",
          Ut = ke("@", !1),
          Jt = /^[a-zA-Z]/,
          Nt = Be([["a", "z"], ["A", "Z"]], !1, !1),
          Tt = "-",
          qt = ke("-", !1),
          Gt = /^[a-zA-Z0-9]/,
          Ht = Be([["a", "z"], ["A", "Z"], ["0", "9"]], !1, !1),
          Kt = function Kt(t, r) {
        return "-" + r.join("");
      },
          Qt = function Qt(t, r) {
        return t.join("") + r.join("");
      },
          Vt = /^[+\-]/,
          Wt = Be(["+", "-"], !1, !1),
          Yt = function Yt(t) {
        return parseInt(t);
      },
          tr = function tr(t) {
        return {
          "@value": t,
          "@type": "http://www.w3.org/2001/XMLSchema#decimal"
        };
      },
          rr = function rr(t) {
        return {
          "@value": t,
          "@type": "http://www.w3.org/2001/XMLSchema#double"
        };
      },
          er = /^[eE]/,
          nr = Be(["e", "E"], !1, !1),
          ur = '"',
          sr = ke('"', !1),
          ar = /^[^"\\\n\r]/,
          cr = Be(['"', "\\", "\n", "\r"], !0, !1),
          or = "'",
          fr = ke("'", !1),
          ir = /^[^'\\\n\r]/,
          hr = Be(["'", "\\", "\n", "\r"], !0, !1),
          lr = "'''",
          Ar = ke("'''", !1),
          pr = /^[^'\\]/,
          dr = Be(["'", "\\"], !0, !1),
          gr = "''",
          vr = ke("''", !1),
          wr = function wr(t, r) {
        return "''" + r.join("");
      },
          br = function br(t, r) {
        return "'" + r.join("");
      },
          Cr = function Cr(t, r) {
        return t.join("") + r.join("");
      },
          xr = '"""',
          Fr = ke('"""', !1),
          yr = /^[^"\\]/,
          mr = Be(['"', "\\"], !0, !1),
          Sr = '""',
          jr = ke('""', !1),
          Er = function Er(t, r) {
        return '""' + r.join("");
      },
          Ir = function Ir(t, r) {
        return '"' + r.join("");
      },
          $r = "\\U",
          Dr = ke("\\U", !1),
          Lr = function Lr(t) {
        return String.fromCodePoint(parseInt(t.join(""), 16));
      },
          Mr = "\\u",
          Rr = ke("\\u", !1),
          Xr = function Xr(t) {
        return String.fromCharCode(parseInt(t.join(""), 16));
      },
          Or = "\\t",
          Pr = ke("\\t", !1),
          zr = function zr() {
        return "\t";
      },
          Zr = "\\b",
          _r = ke("\\b", !1),
          kr = function kr() {
        return "\b";
      },
          Br = "\\n",
          Ur = ke("\\n", !1),
          Jr = function Jr() {
        return "\n";
      },
          Nr = "\\r",
          Tr = ke("\\r", !1),
          qr = function qr() {
        return "\r";
      },
          Gr = "\\f",
          Hr = ke("\\f", !1),
          Kr = function Kr() {
        return "\f";
      },
          Qr = '\\"',
          Vr = ke('\\"', !1),
          Wr = function Wr() {
        return '"';
      },
          Yr = "\\'",
          te = ke("\\'", !1),
          re = function re() {
        return "'";
      },
          ee = "\\\\",
          ne = ke("\\\\", !1),
          ue = function ue() {
        return "\\";
      },
          se = /^[ \t\r\n]/,
          ae = Be([" ", "\t", "\r", "\n"], !1, !1),
          ce = function ce() {
        return "[]";
      },
          oe = /^[\uD800-\uDBFF]/,
          fe = Be([["\ud800", "\udbff"]], !1, !1),
          ie = /^[\uDC00-\uDFFF]/,
          he = Be([["\udc00", "\udfff"]], !1, !1),
          le = function le(t, r) {
        return t + r;
      },
          Ae = /^[A-Za-z\xC0-\xD6\xD8-\xF6\xF8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/,
          pe = Be([["A", "Z"], ["a", "z"], ["À", "Ö"], ["Ø", "ö"], ["ø", "˿"], ["Ͱ", "ͽ"], ["Ϳ", "῿"], ["‌", "‍"], ["⁰", "↏"], ["Ⰰ", "⿯"], ["、", "퟿"], ["豈", "﷏"], ["ﷰ", "�"]], !1, !1),
          de = "_",
          ge = ke("_", !1),
          ve = "·",
          we = ke("·", !1),
          be = /^[\u0300-\u036F]/,
          Ce = Be([["̀", "ͯ"]], !1, !1),
          xe = /^[\u203F-\u2040]/,
          Fe = Be([["‿", "⁀"]], !1, !1),
          ye = function ye(t, r, e, n) {
        return e.join("") + n.join("");
      },
          me = function me(t, r, e) {
        return t + r.join("") + e.join("");
      },
          Se = "%",
          je = ke("%", !1),
          Ee = /^[0-9A-Fa-f]/,
          Ie = Be([["0", "9"], ["A", "F"], ["a", "f"]], !1, !1),
          $e = "\\",
          De = ke("\\", !1),
          Le = /^[_~.!$&'()*+,;=\/?#@%\-]/,
          Me = Be(["_", "~", ".", "!", "$", "&", "'", "(", ")", "*", "+", ",", ";", "=", "/", "?", "#", "@", "%", "-"], !1, !1),
          Re = 0,
          Xe = 0,
          Oe = [{
        line: 1,
        column: 1
      }],
          Pe = 0,
          ze = [];

      if ("startRule" in r) {
        if (!(r.startRule in u)) throw new Error("Can't start parsing from rule \"" + r.startRule + '".');
        s = u[r.startRule];
      }

      function _e(t, r) {
        throw function (t, r) {
          return new peg$SyntaxError(t, null, null, r);
        }(t, r = void 0 !== r ? r : Je(Xe, Re));
      }

      function ke(t, r) {
        return {
          type: "literal",
          text: t,
          ignoreCase: r
        };
      }

      function Be(t, r, e) {
        return {
          type: "class",
          parts: t,
          inverted: r,
          ignoreCase: e
        };
      }

      function Ue(r) {
        var e,
            n = Oe[r];
        if (n) return n;

        for (e = r - 1; !Oe[e];) {
          e--;
        }

        for (n = {
          line: (n = Oe[e]).line,
          column: n.column
        }; e < r;) {
          10 === t.charCodeAt(e) ? (n.line++, n.column = 1) : n.column++, e++;
        }

        return Oe[r] = n, n;
      }

      function Je(t, r) {
        var e = Ue(t),
            n = Ue(r);
        return {
          start: {
            offset: t,
            line: e.line,
            column: e.column
          },
          end: {
            offset: r,
            line: n.line,
            column: n.column
          }
        };
      }

      function Ne(t) {
        Re < Pe || (Re > Pe && (Pe = Re, ze = []), ze.push(t));
      }

      function Te(t, r, e) {
        return new peg$SyntaxError(peg$SyntaxError.buildMessage(t, r), t, r, e);
      }

      function qe() {
        var t, r, e, u;

        for (t = Re, r = [], e = Ge(); e !== n;) {
          r.push(e), e = Ge();
        }

        if (r !== n) {
          for (e = [], u = He(); u !== n;) {
            e.push(u), u = He();
          }

          e !== n ? (Xe = t, t = r = a(r)) : (Re = t, t = n);
        } else Re = t, t = n;

        return t;
      }

      function Ge() {
        var r, e, u, s;
        if ((r = function () {
          var r;
          (r = function () {
            var r, e, u, s, a, f, i, h, l;

            for (r = Re, e = [], u = He(); u !== n;) {
              e.push(u), u = He();
            }

            if (e !== n) {
              if (t.substr(Re, 7) === v ? (u = v, Re += 7) : (u = n,  Ne(w)), u !== n) {
                for (s = [], a = He(); a !== n;) {
                  s.push(a), a = He();
                }

                if (s !== n) {
                  if ((a = an()) !== n) {
                    for (f = [], i = He(); i !== n;) {
                      f.push(i), i = He();
                    }

                    if (f !== n) {
                      if ((i = un()) !== n) {
                        for (h = [], l = He(); l !== n;) {
                          h.push(l), l = He();
                        }

                        h !== n ? (46 === t.charCodeAt(Re) ? (l = c, Re++) : (l = n,  Ne(o)), l !== n ? (Xe = r, e = b(a, i), r = e) : (Re = r, r = n)) : (Re = r, r = n);
                      } else Re = r, r = n;
                    } else Re = r, r = n;
                  } else Re = r, r = n;
                } else Re = r, r = n;
              } else Re = r, r = n;
            } else Re = r, r = n;
            return r;
          }()) === n && (r = function () {
            var r, e, u, s, a, f, i;
            r = Re, e = [], u = He();

            for (; u !== n;) {
              e.push(u), u = He();
            }

            if (e !== n) {
              if (t.substr(Re, 5) === C ? (u = C, Re += 5) : (u = n,  Ne(x)), u !== n) {
                for (s = [], a = He(); a !== n;) {
                  s.push(a), a = He();
                }

                if (s !== n) {
                  if ((a = un()) !== n) {
                    for (f = [], i = He(); i !== n;) {
                      f.push(i), i = He();
                    }

                    f !== n ? (46 === t.charCodeAt(Re) ? (i = c, Re++) : (i = n,  Ne(o)), i !== n ? (Xe = r, e = F(a), r = e) : (Re = r, r = n)) : (Re = r, r = n);
                  } else Re = r, r = n;
                } else Re = r, r = n;
              } else Re = r, r = n;
            } else Re = r, r = n;
            return r;
          }()) === n && (r = function () {
            var r, e, u, s, a, c, o, f, i, h, l, A;
            r = Re, e = [], u = He();

            for (; u !== n;) {
              e.push(u), u = He();
            }

            if (e !== n) {
              if (L.test(t.charAt(Re)) ? (u = t.charAt(Re), Re++) : (u = n,  Ne(M)), u !== n) {
                if (R.test(t.charAt(Re)) ? (s = t.charAt(Re), Re++) : (s = n,  Ne(X)), s !== n) {
                  if ($.test(t.charAt(Re)) ? (a = t.charAt(Re), Re++) : (a = n,  Ne(D)), a !== n) {
                    if (O.test(t.charAt(Re)) ? (c = t.charAt(Re), Re++) : (c = n,  Ne(P)), c !== n) {
                      if (z.test(t.charAt(Re)) ? (o = t.charAt(Re), Re++) : (o = n,  Ne(Z)), o !== n) {
                        if (_.test(t.charAt(Re)) ? (f = t.charAt(Re), Re++) : (f = n,  Ne(k)), f !== n) {
                          for (i = [], h = He(); h !== n;) {
                            i.push(h), h = He();
                          }

                          if (i !== n) {
                            if ((h = an()) !== n) {
                              for (l = [], A = He(); A !== n;) {
                                l.push(A), A = He();
                              }

                              l !== n && (A = un()) !== n ? (Xe = r, e = b(h, A), r = e) : (Re = r, r = n);
                            } else Re = r, r = n;
                          } else Re = r, r = n;
                        } else Re = r, r = n;
                      } else Re = r, r = n;
                    } else Re = r, r = n;
                  } else Re = r, r = n;
                } else Re = r, r = n;
              } else Re = r, r = n;
            } else Re = r, r = n;
            return r;
          }()) === n && (r = function () {
            var r, e, u, s, a, c, o, f;
            r = Re, e = [], u = He();

            for (; u !== n;) {
              e.push(u), u = He();
            }

            if (e !== n) {
              if (y.test(t.charAt(Re)) ? (u = t.charAt(Re), Re++) : (u = n,  Ne(m)), u !== n) {
                if (S.test(t.charAt(Re)) ? (s = t.charAt(Re), Re++) : (s = n,  Ne(j)), s !== n) {
                  if (E.test(t.charAt(Re)) ? (a = t.charAt(Re), Re++) : (a = n,  Ne(I)), a !== n) {
                    if ($.test(t.charAt(Re)) ? (c = t.charAt(Re), Re++) : (c = n,  Ne(D)), c !== n) {
                      for (o = [], f = He(); f !== n;) {
                        o.push(f), f = He();
                      }

                      o !== n && (f = un()) !== n ? (Xe = r, e = F(f), r = e) : (Re = r, r = n);
                    } else Re = r, r = n;
                  } else Re = r, r = n;
                } else Re = r, r = n;
              } else Re = r, r = n;
            } else Re = r, r = n;
            return r;
          }());
          return r;
        }()) === n) if (r = Re, (e = function () {
          var t, r, e;
          t = Re, (r = function () {
            var t, r;
            return t = Re, (r = tn()) !== n && (Xe = t, r = rt(r)), (t = r) === n && (t = nn()) === n && (t = en()), t;
          }()) !== n && (e = Ke()) !== n ? (Xe = t, r = B(r, e), t = r) : (Re = t, t = n);
          t === n && (t = Re, (r = Ye()) !== n ? ((e = Ke()) === n && (e = null), e !== n ? (Xe = t, r = U(r, e), t = r) : (Re = t, t = n)) : (Re = t, t = n));
          return t;
        }()) !== n) {
          for (u = [], s = He(); s !== n;) {
            u.push(s), s = He();
          }

          u !== n ? (46 === t.charCodeAt(Re) ? (s = c, Re++) : (s = n,  Ne(o)), s !== n ? (Xe = r, r = e = f(e)) : (Re = r, r = n)) : (Re = r, r = n);
        } else Re = r, r = n;
        return r;
      }

      function He() {
        var r;
        return (r = function () {
          var r;
          se.test(t.charAt(Re)) ? (r = t.charAt(Re), Re++) : (r = n,  Ne(ae));
          return r;
        }()) === n && (r = function () {
          var r, e, u, s;

          if (r = Re, 35 === t.charCodeAt(Re) ? (e = i, Re++) : (e = n,  Ne(h)), e !== n) {
            for (u = [], l.test(t.charAt(Re)) ? (s = t.charAt(Re), Re++) : (s = n,  Ne(A)); s !== n;) {
              u.push(s), l.test(t.charAt(Re)) ? (s = t.charAt(Re), Re++) : (s = n,  Ne(A));
            }

            u !== n ? (10 === t.charCodeAt(Re) ? (s = p, Re++) : (s = n,  Ne(d)), s !== n ? (Xe = r, r = e = g(u)) : (Re = r, r = n)) : (Re = r, r = n);
          } else Re = r, r = n;

          return r;
        }()), r;
      }

      function Ke() {
        var r, e, u, s, a, c, o, f, i, h;
        if (r = Re, (e = Ve()) !== n) {
          if ((u = Qe()) !== n) {
            for (s = [], a = Re, c = [], o = He(); o !== n;) {
              c.push(o), o = He();
            }

            for (c !== n ? (59 === t.charCodeAt(Re) ? (o = J, Re++) : (o = n,  Ne(N)), o !== n ? (f = Re, (i = Ve()) !== n && (h = Qe()) !== n ? (Xe = f, f = i = T(e, u, i, h)) : (Re = f, f = n), f === n && (f = null), f !== n ? (Xe = a, a = c = q(e, u, f)) : (Re = a, a = n)) : (Re = a, a = n)) : (Re = a, a = n); a !== n;) {
              for (s.push(a), a = Re, c = [], o = He(); o !== n;) {
                c.push(o), o = He();
              }

              c !== n ? (59 === t.charCodeAt(Re) ? (o = J, Re++) : (o = n,  Ne(N)), o !== n ? (f = Re, (i = Ve()) !== n && (h = Qe()) !== n ? (Xe = f, f = i = T(e, u, i, h)) : (Re = f, f = n), f === n && (f = null), f !== n ? (Xe = a, a = c = q(e, u, f)) : (Re = a, a = n)) : (Re = a, a = n)) : (Re = a, a = n);
            }

            s !== n ? (Xe = r, r = e = G(e, u, s)) : (Re = r, r = n);
          } else Re = r, r = n;
        } else Re = r, r = n;
        return r;
      }

      function Qe() {
        var r, e, u, s, a, c, o;

        if (r = Re, (e = We()) !== n) {
          for (u = [], s = Re, a = [], c = He(); c !== n;) {
            a.push(c), c = He();
          }

          for (a !== n ? (44 === t.charCodeAt(Re) ? (c = H, Re++) : (c = n,  Ne(K)), c !== n && (o = We()) !== n ? (Xe = s, s = a = Q(e, o)) : (Re = s, s = n)) : (Re = s, s = n); s !== n;) {
            for (u.push(s), s = Re, a = [], c = He(); c !== n;) {
              a.push(c), c = He();
            }

            a !== n ? (44 === t.charCodeAt(Re) ? (c = H, Re++) : (c = n,  Ne(K)), c !== n && (o = We()) !== n ? (Xe = s, s = a = Q(e, o)) : (Re = s, s = n)) : (Re = s, s = n);
          }

          u !== n ? (Xe = r, r = e = V(e, u)) : (Re = r, r = n);
        } else Re = r, r = n;

        return r;
      }

      function Ve() {
        var r, e, u;

        if (r = Re, (e = function () {
          var t, r, e;
          t = Re, r = [], e = He();

          for (; e !== n;) {
            r.push(e), e = He();
          }

          r !== n && (e = en()) !== n ? (Xe = t, r = f(e), t = r) : (Re = t, t = n);
          return t;
        }()) !== n && (Xe = r, e = f(e)), (r = e) === n) {
          for (r = Re, e = [], u = He(); u !== n;) {
            e.push(u), u = He();
          }

          e !== n ? (97 === t.charCodeAt(Re) ? (u = W, Re++) : (u = n,  Ne(Y)), u !== n ? (Xe = r, r = e = tt()) : (Re = r, r = n)) : (Re = r, r = n);
        }

        return r;
      }

      function We() {
        var r, e;
        return (r = function () {
          var r;
          (r = function () {
            var r, e, u, s, a, c, o;

            for (r = Re, e = [], u = He(); u !== n;) {
              e.push(u), u = He();
            }

            if (e !== n) {
              if ((u = rn()) !== n) {
                for (s = [], a = He(); a !== n;) {
                  s.push(a), a = He();
                }

                s !== n && (a = function () {
                  var r, e, u, s, a, c, o, f;

                  if (r = Re, 64 === t.charCodeAt(Re) ? (e = Bt, Re++) : (e = n,  Ne(Ut)), e !== n) {
                    if (u = [], Jt.test(t.charAt(Re)) ? (s = t.charAt(Re), Re++) : (s = n,  Ne(Nt)), s !== n) for (; s !== n;) {
                      u.push(s), Jt.test(t.charAt(Re)) ? (s = t.charAt(Re), Re++) : (s = n,  Ne(Nt));
                    } else u = n;

                    if (u !== n) {
                      if (s = [], a = Re, 45 === t.charCodeAt(Re) ? (c = Tt, Re++) : (c = n,  Ne(qt)), c !== n) {
                        if (o = [], Gt.test(t.charAt(Re)) ? (f = t.charAt(Re), Re++) : (f = n,  Ne(Ht)), f !== n) for (; f !== n;) {
                          o.push(f), Gt.test(t.charAt(Re)) ? (f = t.charAt(Re), Re++) : (f = n,  Ne(Ht));
                        } else o = n;
                        o !== n ? (Xe = a, c = Kt(u, o), a = c) : (Re = a, a = n);
                      } else Re = a, a = n;

                      for (; a !== n;) {
                        if (s.push(a), a = Re, 45 === t.charCodeAt(Re) ? (c = Tt, Re++) : (c = n,  Ne(qt)), c !== n) {
                          if (o = [], Gt.test(t.charAt(Re)) ? (f = t.charAt(Re), Re++) : (f = n,  Ne(Ht)), f !== n) for (; f !== n;) {
                            o.push(f), Gt.test(t.charAt(Re)) ? (f = t.charAt(Re), Re++) : (f = n,  Ne(Ht));
                          } else o = n;
                          o !== n ? (Xe = a, c = Kt(u, o), a = c) : (Re = a, a = n);
                        } else Re = a, a = n;
                      }

                      s !== n ? (Xe = r, e = Qt(u, s), r = e) : (Re = r, r = n);
                    } else Re = r, r = n;
                  } else Re = r, r = n;

                  return r;
                }()) !== n ? (Xe = r, e = pt(u, a), r = e) : (Re = r, r = n);
              } else Re = r, r = n;
            } else Re = r, r = n;

            if (r === n) {
              for (r = Re, e = [], u = He(); u !== n;) {
                e.push(u), u = He();
              }

              if (e !== n) {
                if ((u = rn()) !== n) {
                  for (s = [], a = He(); a !== n;) {
                    s.push(a), a = He();
                  }

                  if (s !== n) {
                    if (t.substr(Re, 2) === dt ? (a = dt, Re += 2) : (a = n,  Ne(gt)), a !== n) {
                      for (c = [], o = He(); o !== n;) {
                        c.push(o), o = He();
                      }

                      c !== n && (o = en()) !== n ? (Xe = r, e = vt(u, o), r = e) : (Re = r, r = n);
                    } else Re = r, r = n;
                  } else Re = r, r = n;
                } else Re = r, r = n;
              } else Re = r, r = n;

              if (r === n) {
                for (r = Re, e = [], u = He(); u !== n;) {
                  e.push(u), u = He();
                }

                e !== n && (u = rn()) !== n ? (Xe = r, e = f(u), r = e) : (Re = r, r = n);
              }
            }

            return r;
          }()) === n && (r = function () {
            var r, e, u;
            r = Re, e = [], u = He();

            for (; u !== n;) {
              e.push(u), u = He();
            }

            e !== n ? ((u = function () {
              var r, e, u, s, a, f, i, h, l;
              r = Re, e = Re, u = Re, Vt.test(t.charAt(Re)) ? (s = t.charAt(Re), Re++) : (s = n,  Ne(Wt));
              s === n && (s = null);

              if (s !== n) {
                if (a = Re, f = [], _t.test(t.charAt(Re)) ? (i = t.charAt(Re), Re++) : (i = n,  Ne(kt)), i !== n) for (; i !== n;) {
                  f.push(i), _t.test(t.charAt(Re)) ? (i = t.charAt(Re), Re++) : (i = n,  Ne(kt));
                } else f = n;
                if (f !== n) {
                  if (46 === t.charCodeAt(Re) ? (i = c, Re++) : (i = n,  Ne(o)), i !== n) {
                    for (h = [], _t.test(t.charAt(Re)) ? (l = t.charAt(Re), Re++) : (l = n,  Ne(kt)); l !== n;) {
                      h.push(l), _t.test(t.charAt(Re)) ? (l = t.charAt(Re), Re++) : (l = n,  Ne(kt));
                    }

                    h !== n && (l = cn()) !== n ? a = f = [f, i, h, l] : (Re = a, a = n);
                  } else Re = a, a = n;
                } else Re = a, a = n;

                if (a === n) {
                  if (a = Re, 46 === t.charCodeAt(Re) ? (f = c, Re++) : (f = n,  Ne(o)), f !== n) {
                    if (i = [], _t.test(t.charAt(Re)) ? (h = t.charAt(Re), Re++) : (h = n,  Ne(kt)), h !== n) for (; h !== n;) {
                      i.push(h), _t.test(t.charAt(Re)) ? (h = t.charAt(Re), Re++) : (h = n,  Ne(kt));
                    } else i = n;
                    i !== n && (h = cn()) !== n ? a = f = [f, i, h] : (Re = a, a = n);
                  } else Re = a, a = n;

                  if (a === n) {
                    if (a = Re, f = [], _t.test(t.charAt(Re)) ? (i = t.charAt(Re), Re++) : (i = n,  Ne(kt)), i !== n) for (; i !== n;) {
                      f.push(i), _t.test(t.charAt(Re)) ? (i = t.charAt(Re), Re++) : (i = n,  Ne(kt));
                    } else f = n;
                    f !== n && (i = cn()) !== n ? a = f = [f, i] : (Re = a, a = n);
                  }
                }

                a !== n ? u = s = [s, a] : (Re = u, u = n);
              } else Re = u, u = n;

              e = u !== n ? t.substring(e, Re) : u;
              e !== n && (Xe = r, e = rr(e));
              return r = e;
            }()) === n && (u = function () {
              var r, e, u, s, a, f, i, h;
              r = Re, e = Re, u = Re, Vt.test(t.charAt(Re)) ? (s = t.charAt(Re), Re++) : (s = n,  Ne(Wt));
              s === n && (s = null);

              if (s !== n) {
                for (a = [], _t.test(t.charAt(Re)) ? (f = t.charAt(Re), Re++) : (f = n,  Ne(kt)); f !== n;) {
                  a.push(f), _t.test(t.charAt(Re)) ? (f = t.charAt(Re), Re++) : (f = n,  Ne(kt));
                }

                if (a !== n) {
                  if (46 === t.charCodeAt(Re) ? (f = c, Re++) : (f = n,  Ne(o)), f !== n) {
                    if (i = [], _t.test(t.charAt(Re)) ? (h = t.charAt(Re), Re++) : (h = n,  Ne(kt)), h !== n) for (; h !== n;) {
                      i.push(h), _t.test(t.charAt(Re)) ? (h = t.charAt(Re), Re++) : (h = n,  Ne(kt));
                    } else i = n;
                    i !== n ? u = s = [s, a, f, i] : (Re = u, u = n);
                  } else Re = u, u = n;
                } else Re = u, u = n;
              } else Re = u, u = n;

              e = u !== n ? t.substring(e, Re) : u;
              e !== n && (Xe = r, e = tr(e));
              return r = e;
            }()) === n && (u = function () {
              var r, e, u, s, a, c;
              r = Re, e = Re, u = Re, Vt.test(t.charAt(Re)) ? (s = t.charAt(Re), Re++) : (s = n,  Ne(Wt));
              s === n && (s = null);

              if (s !== n) {
                if (a = [], _t.test(t.charAt(Re)) ? (c = t.charAt(Re), Re++) : (c = n,  Ne(kt)), c !== n) for (; c !== n;) {
                  a.push(c), _t.test(t.charAt(Re)) ? (c = t.charAt(Re), Re++) : (c = n,  Ne(kt));
                } else a = n;
                a !== n ? u = s = [s, a] : (Re = u, u = n);
              } else Re = u, u = n;

              e = u !== n ? t.substring(e, Re) : u;
              e !== n && (Xe = r, e = Yt(e));
              return r = e;
            }()), u !== n ? (Xe = r, e = f(u), r = e) : (Re = r, r = n)) : (Re = r, r = n);
            return r;
          }()) === n && (r = function () {
            var r, e, u;
            r = Re, e = [], u = He();

            for (; u !== n;) {
              e.push(u), u = He();
            }

            e !== n ? (t.substr(Re, 4) === wt ? (u = wt, Re += 4) : (u = n,  Ne(bt)), u !== n ? (Xe = r, e = Ct(), r = e) : (Re = r, r = n)) : (Re = r, r = n);

            if (r === n) {
              for (r = Re, e = [], u = He(); u !== n;) {
                e.push(u), u = He();
              }

              e !== n ? (t.substr(Re, 5) === xt ? (u = xt, Re += 5) : (u = n,  Ne(Ft)), u !== n ? (Xe = r, e = yt(), r = e) : (Re = r, r = n)) : (Re = r, r = n);
            }

            return r;
          }());
          return r;
        }()) === n && (r = Re, (e = tn()) !== n && (Xe = r, e = et(e)), (r = e) === n && (r = Re, (e = nn()) !== n && (Xe = r, e = nt(e)), (r = e) === n && (r = Re, (e = Ye()) !== n && (Xe = r, e = f(e)), (r = e) === n && (r = Re, (e = en()) !== n && (Xe = r, e = ut(e)), r = e)))), r;
      }

      function Ye() {
        var r, e, u, s, a, c;

        for (r = Re, e = [], u = He(); u !== n;) {
          e.push(u), u = He();
        }

        if (e !== n) {
          if (91 === t.charCodeAt(Re) ? (u = st, Re++) : (u = n,  Ne(at)), u !== n) {
            if ((s = Ke()) !== n) {
              for (a = [], c = He(); c !== n;) {
                a.push(c), c = He();
              }

              a !== n ? (93 === t.charCodeAt(Re) ? (c = ct, Re++) : (c = n,  Ne(ot)), c !== n ? (Xe = r, r = e = f(s)) : (Re = r, r = n)) : (Re = r, r = n);
            } else Re = r, r = n;
          } else Re = r, r = n;
        } else Re = r, r = n;
        return r;
      }

      function tn() {
        var r, e, u, s, a, c;

        for (r = Re, e = [], u = He(); u !== n;) {
          e.push(u), u = He();
        }

        if (e !== n) {
          if (40 === t.charCodeAt(Re) ? (u = ft, Re++) : (u = n,  Ne(it)), u !== n) {
            for (s = [], a = We(); a !== n;) {
              s.push(a), a = We();
            }

            if (s !== n) {
              for (a = [], c = He(); c !== n;) {
                a.push(c), c = He();
              }

              a !== n ? (41 === t.charCodeAt(Re) ? (c = ht, Re++) : (c = n,  Ne(lt)), c !== n ? (Xe = r, r = e = At(s)) : (Re = r, r = n)) : (Re = r, r = n);
            } else Re = r, r = n;
          } else Re = r, r = n;
        } else Re = r, r = n;
        return r;
      }

      function rn() {
        var r, e, u;

        for (r = Re, e = [], u = He(); u !== n;) {
          e.push(u), u = He();
        }

        return e !== n ? ((u = function () {
          var r, e, u, s, a, c, o, f;
          r = Re, t.substr(Re, 3) === lr ? (e = lr, Re += 3) : (e = n,  Ne(Ar));

          if (e !== n) {
            for (u = [], pr.test(t.charAt(Re)) ? (s = t.charAt(Re), Re++) : (s = n,  Ne(dr)), s === n && (s = fn()) === n && (s = on()); s !== n;) {
              u.push(s), pr.test(t.charAt(Re)) ? (s = t.charAt(Re), Re++) : (s = n,  Ne(dr)), s === n && (s = fn()) === n && (s = on());
            }

            if (u !== n) {
              if (s = [], a = Re, t.substr(Re, 2) === gr ? (c = gr, Re += 2) : (c = n,  Ne(vr)), c !== n) {
                if (o = [], pr.test(t.charAt(Re)) ? (f = t.charAt(Re), Re++) : (f = n,  Ne(dr)), f === n && (f = fn()) === n && (f = on()), f !== n) for (; f !== n;) {
                  o.push(f), pr.test(t.charAt(Re)) ? (f = t.charAt(Re), Re++) : (f = n,  Ne(dr)), f === n && (f = fn()) === n && (f = on());
                } else o = n;
                o !== n ? (Xe = a, c = wr(u, o), a = c) : (Re = a, a = n);
              } else Re = a, a = n;

              if (a === n) if (a = Re, 39 === t.charCodeAt(Re) ? (c = or, Re++) : (c = n,  Ne(fr)), c !== n) {
                if (o = [], pr.test(t.charAt(Re)) ? (f = t.charAt(Re), Re++) : (f = n,  Ne(dr)), f === n && (f = fn()) === n && (f = on()), f !== n) for (; f !== n;) {
                  o.push(f), pr.test(t.charAt(Re)) ? (f = t.charAt(Re), Re++) : (f = n,  Ne(dr)), f === n && (f = fn()) === n && (f = on());
                } else o = n;
                o !== n ? (Xe = a, c = br(u, o), a = c) : (Re = a, a = n);
              } else Re = a, a = n;

              for (; a !== n;) {
                if (s.push(a), a = Re, t.substr(Re, 2) === gr ? (c = gr, Re += 2) : (c = n,  Ne(vr)), c !== n) {
                  if (o = [], pr.test(t.charAt(Re)) ? (f = t.charAt(Re), Re++) : (f = n,  Ne(dr)), f === n && (f = fn()) === n && (f = on()), f !== n) for (; f !== n;) {
                    o.push(f), pr.test(t.charAt(Re)) ? (f = t.charAt(Re), Re++) : (f = n,  Ne(dr)), f === n && (f = fn()) === n && (f = on());
                  } else o = n;
                  o !== n ? (Xe = a, c = wr(u, o), a = c) : (Re = a, a = n);
                } else Re = a, a = n;

                if (a === n) if (a = Re, 39 === t.charCodeAt(Re) ? (c = or, Re++) : (c = n,  Ne(fr)), c !== n) {
                  if (o = [], pr.test(t.charAt(Re)) ? (f = t.charAt(Re), Re++) : (f = n,  Ne(dr)), f === n && (f = fn()) === n && (f = on()), f !== n) for (; f !== n;) {
                    o.push(f), pr.test(t.charAt(Re)) ? (f = t.charAt(Re), Re++) : (f = n,  Ne(dr)), f === n && (f = fn()) === n && (f = on());
                  } else o = n;
                  o !== n ? (Xe = a, c = br(u, o), a = c) : (Re = a, a = n);
                } else Re = a, a = n;
              }

              s !== n ? (t.substr(Re, 3) === lr ? (a = lr, Re += 3) : (a = n,  Ne(Ar)), a !== n ? (Xe = r, e = Cr(u, s), r = e) : (Re = r, r = n)) : (Re = r, r = n);
            } else Re = r, r = n;
          } else Re = r, r = n;

          return r;
        }()) === n && (u = function () {
          var r, e, u, s, a, c, o, f;
          r = Re, t.substr(Re, 3) === xr ? (e = xr, Re += 3) : (e = n,  Ne(Fr));

          if (e !== n) {
            for (u = [], yr.test(t.charAt(Re)) ? (s = t.charAt(Re), Re++) : (s = n,  Ne(mr)), s === n && (s = fn()) === n && (s = on()); s !== n;) {
              u.push(s), yr.test(t.charAt(Re)) ? (s = t.charAt(Re), Re++) : (s = n,  Ne(mr)), s === n && (s = fn()) === n && (s = on());
            }

            if (u !== n) {
              if (s = [], a = Re, t.substr(Re, 2) === Sr ? (c = Sr, Re += 2) : (c = n,  Ne(jr)), c !== n) {
                if (o = [], yr.test(t.charAt(Re)) ? (f = t.charAt(Re), Re++) : (f = n,  Ne(mr)), f === n && (f = fn()) === n && (f = on()), f !== n) for (; f !== n;) {
                  o.push(f), yr.test(t.charAt(Re)) ? (f = t.charAt(Re), Re++) : (f = n,  Ne(mr)), f === n && (f = fn()) === n && (f = on());
                } else o = n;
                o !== n ? (Xe = a, c = Er(u, o), a = c) : (Re = a, a = n);
              } else Re = a, a = n;

              if (a === n) if (a = Re, 34 === t.charCodeAt(Re) ? (c = ur, Re++) : (c = n,  Ne(sr)), c !== n) {
                if (o = [], yr.test(t.charAt(Re)) ? (f = t.charAt(Re), Re++) : (f = n,  Ne(mr)), f === n && (f = fn()) === n && (f = on()), f !== n) for (; f !== n;) {
                  o.push(f), yr.test(t.charAt(Re)) ? (f = t.charAt(Re), Re++) : (f = n,  Ne(mr)), f === n && (f = fn()) === n && (f = on());
                } else o = n;
                o !== n ? (Xe = a, c = Ir(u, o), a = c) : (Re = a, a = n);
              } else Re = a, a = n;

              for (; a !== n;) {
                if (s.push(a), a = Re, t.substr(Re, 2) === Sr ? (c = Sr, Re += 2) : (c = n,  Ne(jr)), c !== n) {
                  if (o = [], yr.test(t.charAt(Re)) ? (f = t.charAt(Re), Re++) : (f = n,  Ne(mr)), f === n && (f = fn()) === n && (f = on()), f !== n) for (; f !== n;) {
                    o.push(f), yr.test(t.charAt(Re)) ? (f = t.charAt(Re), Re++) : (f = n,  Ne(mr)), f === n && (f = fn()) === n && (f = on());
                  } else o = n;
                  o !== n ? (Xe = a, c = Er(u, o), a = c) : (Re = a, a = n);
                } else Re = a, a = n;

                if (a === n) if (a = Re, 34 === t.charCodeAt(Re) ? (c = ur, Re++) : (c = n,  Ne(sr)), c !== n) {
                  if (o = [], yr.test(t.charAt(Re)) ? (f = t.charAt(Re), Re++) : (f = n,  Ne(mr)), f === n && (f = fn()) === n && (f = on()), f !== n) for (; f !== n;) {
                    o.push(f), yr.test(t.charAt(Re)) ? (f = t.charAt(Re), Re++) : (f = n,  Ne(mr)), f === n && (f = fn()) === n && (f = on());
                  } else o = n;
                  o !== n ? (Xe = a, c = Ir(u, o), a = c) : (Re = a, a = n);
                } else Re = a, a = n;
              }

              s !== n ? (t.substr(Re, 3) === xr ? (a = xr, Re += 3) : (a = n,  Ne(Fr)), a !== n ? (Xe = r, e = Cr(u, s), r = e) : (Re = r, r = n)) : (Re = r, r = n);
            } else Re = r, r = n;
          } else Re = r, r = n;

          return r;
        }()) === n && (u = function () {
          var r, e, u, s;
          r = Re, 39 === t.charCodeAt(Re) ? (e = or, Re++) : (e = n,  Ne(fr));

          if (e !== n) {
            for (u = [], ir.test(t.charAt(Re)) ? (s = t.charAt(Re), Re++) : (s = n,  Ne(hr)), s === n && (s = fn()) === n && (s = on()); s !== n;) {
              u.push(s), ir.test(t.charAt(Re)) ? (s = t.charAt(Re), Re++) : (s = n,  Ne(hr)), s === n && (s = fn()) === n && (s = on());
            }

            u !== n ? (39 === t.charCodeAt(Re) ? (s = or, Re++) : (s = n,  Ne(fr)), s !== n ? (Xe = r, e = g(u), r = e) : (Re = r, r = n)) : (Re = r, r = n);
          } else Re = r, r = n;

          return r;
        }()) === n && (u = function () {
          var r, e, u, s;
          r = Re, 34 === t.charCodeAt(Re) ? (e = ur, Re++) : (e = n,  Ne(sr));

          if (e !== n) {
            for (u = [], ar.test(t.charAt(Re)) ? (s = t.charAt(Re), Re++) : (s = n,  Ne(cr)), s === n && (s = fn()) === n && (s = on()); s !== n;) {
              u.push(s), ar.test(t.charAt(Re)) ? (s = t.charAt(Re), Re++) : (s = n,  Ne(cr)), s === n && (s = fn()) === n && (s = on());
            }

            u !== n ? (34 === t.charCodeAt(Re) ? (s = ur, Re++) : (s = n,  Ne(sr)), s !== n ? (Xe = r, e = g(u), r = e) : (Re = r, r = n)) : (Re = r, r = n);
          } else Re = r, r = n;

          return r;
        }()), u !== n ? (Xe = r, r = e = f(u)) : (Re = r, r = n)) : (Re = r, r = n), r;
      }

      function en() {
        var r, e, u;

        for (r = Re, e = [], u = He(); u !== n;) {
          e.push(u), u = He();
        }

        if (e !== n && (u = un()) !== n ? (Xe = r, r = e = f(u)) : (Re = r, r = n), r === n) {
          for (r = Re, e = [], u = He(); u !== n;) {
            e.push(u), u = He();
          }

          e !== n && (u = function () {
            var r, e;
            (r = function () {
              var r, e, u;
              return r = Re, (e = sn()) !== n && (u = function () {
                var r, e, u, s, a, f, i, h;

                if (r = Re, (e = ln()) === n && (58 === t.charCodeAt(Re) ? (e = Mt, Re++) : (e = n,  Ne(Rt)), e === n && (_t.test(t.charAt(Re)) ? (e = t.charAt(Re), Re++) : (e = n,  Ne(kt)), e === n && (e = dn()))), e !== n) {
                  for (u = [], (s = An()) === n && (58 === t.charCodeAt(Re) ? (s = Mt, Re++) : (s = n,  Ne(Rt)), s === n && (s = dn())); s !== n;) {
                    u.push(s), (s = An()) === n && (58 === t.charCodeAt(Re) ? (s = Mt, Re++) : (s = n,  Ne(Rt)), s === n && (s = dn()));
                  }

                  if (u !== n) {
                    if (s = [], a = Re, f = [], 46 === t.charCodeAt(Re) ? (i = c, Re++) : (i = n,  Ne(o)), i !== n) for (; i !== n;) {
                      f.push(i), 46 === t.charCodeAt(Re) ? (i = c, Re++) : (i = n,  Ne(o));
                    } else f = n;

                    if (f !== n) {
                      if (i = [], (h = An()) === n && (58 === t.charCodeAt(Re) ? (h = Mt, Re++) : (h = n,  Ne(Rt)), h === n && (h = dn())), h !== n) for (; h !== n;) {
                        i.push(h), (h = An()) === n && (58 === t.charCodeAt(Re) ? (h = Mt, Re++) : (h = n,  Ne(Rt)), h === n && (h = dn()));
                      } else i = n;
                      i !== n ? (Xe = a, f = ye(e, u, f, i), a = f) : (Re = a, a = n);
                    } else Re = a, a = n;

                    for (; a !== n;) {
                      if (s.push(a), a = Re, f = [], 46 === t.charCodeAt(Re) ? (i = c, Re++) : (i = n,  Ne(o)), i !== n) for (; i !== n;) {
                        f.push(i), 46 === t.charCodeAt(Re) ? (i = c, Re++) : (i = n,  Ne(o));
                      } else f = n;

                      if (f !== n) {
                        if (i = [], (h = An()) === n && (58 === t.charCodeAt(Re) ? (h = Mt, Re++) : (h = n,  Ne(Rt)), h === n && (h = dn())), h !== n) for (; h !== n;) {
                          i.push(h), (h = An()) === n && (58 === t.charCodeAt(Re) ? (h = Mt, Re++) : (h = n,  Ne(Rt)), h === n && (h = dn()));
                        } else i = n;
                        i !== n ? (Xe = a, f = ye(e, u, f, i), a = f) : (Re = a, a = n);
                      } else Re = a, a = n;
                    }

                    s !== n ? (Xe = r, e = me(e, u, s), r = e) : (Re = r, r = n);
                  } else Re = r, r = n;
                } else Re = r, r = n;

                return r;
              }()) !== n ? (Xe = r, e = Pt(e, u), r = e) : (Re = r, r = n), r;
            }()) === n && (r = Re, (e = sn()) !== n && (Xe = r, e = mt(e)), r = e);
            return r;
          }()) !== n ? (Xe = r, r = e = f(u)) : (Re = r, r = n);
        }

        return r;
      }

      function nn() {
        var r, e, u;

        for (r = Re, e = [], u = He(); u !== n;) {
          e.push(u), u = He();
        }

        if (e !== n && (u = function () {
          var r, e, u, s, a, f, i, h, l, A;
          r = Re, e = Re, t.substr(Re, 2) === zt ? (u = zt, Re += 2) : (u = n,  Ne(Zt));
          if (u !== n) {
            if ((s = ln()) === n && (_t.test(t.charAt(Re)) ? (s = t.charAt(Re), Re++) : (s = n,  Ne(kt))), s !== n) {
              for (a = [], f = An(); f !== n;) {
                a.push(f), f = An();
              }

              if (a !== n) {
                if (f = [], i = Re, h = [], 46 === t.charCodeAt(Re) ? (l = c, Re++) : (l = n,  Ne(o)), l !== n) for (; l !== n;) {
                  h.push(l), 46 === t.charCodeAt(Re) ? (l = c, Re++) : (l = n,  Ne(o));
                } else h = n;

                if (h !== n) {
                  if (l = [], (A = An()) !== n) for (; A !== n;) {
                    l.push(A), A = An();
                  } else l = n;
                  l !== n ? i = h = [h, l] : (Re = i, i = n);
                } else Re = i, i = n;

                for (; i !== n;) {
                  if (f.push(i), i = Re, h = [], 46 === t.charCodeAt(Re) ? (l = c, Re++) : (l = n,  Ne(o)), l !== n) for (; l !== n;) {
                    h.push(l), 46 === t.charCodeAt(Re) ? (l = c, Re++) : (l = n,  Ne(o));
                  } else h = n;

                  if (h !== n) {
                    if (l = [], (A = An()) !== n) for (; A !== n;) {
                      l.push(A), A = An();
                    } else l = n;
                    l !== n ? i = h = [h, l] : (Re = i, i = n);
                  } else Re = i, i = n;
                }

                f !== n ? e = u = [u, s, a, f] : (Re = e, e = n);
              } else Re = e, e = n;
            } else Re = e, e = n;
          } else Re = e, e = n;
          r = e !== n ? t.substring(r, Re) : e;
          return r;
        }()) !== n ? (Xe = r, r = e = f(u)) : (Re = r, r = n), r === n) {
          for (r = Re, e = [], u = He(); u !== n;) {
            e.push(u), u = He();
          }

          e !== n && (u = function () {
            var r, e, u, s;
            r = Re, 91 === t.charCodeAt(Re) ? (e = st, Re++) : (e = n,  Ne(at));

            if (e !== n) {
              for (u = [], s = He(); s !== n;) {
                u.push(s), s = He();
              }

              u !== n ? (93 === t.charCodeAt(Re) ? (s = ct, Re++) : (s = n,  Ne(ot)), s !== n ? (Xe = r, e = ce(), r = e) : (Re = r, r = n)) : (Re = r, r = n);
            } else Re = r, r = n;

            return r;
          }()) !== n ? (Xe = r, r = e = f(u)) : (Re = r, r = n);
        }

        return r;
      }

      function un() {
        var r, e, u, s;

        if (r = Re, 60 === t.charCodeAt(Re) ? (e = St, Re++) : (e = n,  Ne(jt)), e !== n) {
          for (u = [], Et.test(t.charAt(Re)) ? (s = t.charAt(Re), Re++) : (s = n,  Ne(It)), s === n && (s = on()); s !== n;) {
            u.push(s), Et.test(t.charAt(Re)) ? (s = t.charAt(Re), Re++) : (s = n,  Ne(It)), s === n && (s = on());
          }

          u !== n ? (62 === t.charCodeAt(Re) ? (s = $t, Re++) : (s = n,  Ne(Dt)), s !== n ? (Xe = r, r = e = Lt(u)) : (Re = r, r = n)) : (Re = r, r = n);
        } else Re = r, r = n;

        return r;
      }

      function sn() {
        var r, e, u;
        return r = Re, (e = pn()) === n && (e = null), e !== n ? (58 === t.charCodeAt(Re) ? (u = Mt, Re++) : (u = n,  Ne(Rt)), u !== n ? (Xe = r, r = e = Xt(e)) : (Re = r, r = n)) : (Re = r, r = n), r;
      }

      function an() {
        var r, e, u;
        return r = Re, (e = pn()) === n && (e = null), e !== n ? (58 === t.charCodeAt(Re) ? (u = Mt, Re++) : (u = n,  Ne(Rt)), u !== n ? (Xe = r, r = e = Ot(e)) : (Re = r, r = n)) : (Re = r, r = n), r;
      }

      function cn() {
        var r, e, u, s, a, c;
        if (r = Re, e = Re, er.test(t.charAt(Re)) ? (u = t.charAt(Re), Re++) : (u = n,  Ne(nr)), u !== n) {
          if (Vt.test(t.charAt(Re)) ? (s = t.charAt(Re), Re++) : (s = n,  Ne(Wt)), s === n && (s = null), s !== n) {
            if (a = [], _t.test(t.charAt(Re)) ? (c = t.charAt(Re), Re++) : (c = n,  Ne(kt)), c !== n) for (; c !== n;) {
              a.push(c), _t.test(t.charAt(Re)) ? (c = t.charAt(Re), Re++) : (c = n,  Ne(kt));
            } else a = n;
            a !== n ? e = u = [u, s, a] : (Re = e, e = n);
          } else Re = e, e = n;
        } else Re = e, e = n;
        return r = e !== n ? t.substring(r, Re) : e;
      }

      function on() {
        var r, e, u, s, a, c, o, f, i, h, l;
        return r = Re, t.substr(Re, 2) === $r ? (e = $r, Re += 2) : (e = n,  Ne(Dr)), e !== n ? (u = Re, (s = gn()) !== n && (a = gn()) !== n && (c = gn()) !== n && (o = gn()) !== n && (f = gn()) !== n && (i = gn()) !== n && (h = gn()) !== n && (l = gn()) !== n ? u = s = [s, a, c, o, f, i, h, l] : (Re = u, u = n), u !== n ? (Xe = r, r = e = Lr(u)) : (Re = r, r = n)) : (Re = r, r = n), r === n && (r = Re, t.substr(Re, 2) === Mr ? (e = Mr, Re += 2) : (e = n,  Ne(Rr)), e !== n ? (u = Re, (s = gn()) !== n && (a = gn()) !== n && (c = gn()) !== n && (o = gn()) !== n ? u = s = [s, a, c, o] : (Re = u, u = n), u !== n ? (Xe = r, r = e = Xr(u)) : (Re = r, r = n)) : (Re = r, r = n)), r;
      }

      function fn() {
        var r, e;
        return r = Re, t.substr(Re, 2) === Or ? (e = Or, Re += 2) : (e = n,  Ne(Pr)), e !== n && (Xe = r, e = zr()), (r = e) === n && (r = Re, t.substr(Re, 2) === Zr ? (e = Zr, Re += 2) : (e = n,  Ne(_r)), e !== n && (Xe = r, e = kr()), (r = e) === n && (r = Re, t.substr(Re, 2) === Br ? (e = Br, Re += 2) : (e = n,  Ne(Ur)), e !== n && (Xe = r, e = Jr()), (r = e) === n && (r = Re, t.substr(Re, 2) === Nr ? (e = Nr, Re += 2) : (e = n,  Ne(Tr)), e !== n && (Xe = r, e = qr()), (r = e) === n && (r = Re, t.substr(Re, 2) === Gr ? (e = Gr, Re += 2) : (e = n,  Ne(Hr)), e !== n && (Xe = r, e = Kr()), (r = e) === n && (r = Re, t.substr(Re, 2) === Qr ? (e = Qr, Re += 2) : (e = n,  Ne(Vr)), e !== n && (Xe = r, e = Wr()), (r = e) === n && (r = Re, t.substr(Re, 2) === Yr ? (e = Yr, Re += 2) : (e = n,  Ne(te)), e !== n && (Xe = r, e = re()), (r = e) === n && (r = Re, t.substr(Re, 2) === ee ? (e = ee, Re += 2) : (e = n,  Ne(ne)), e !== n && (Xe = r, e = ue()), r = e))))))), r;
      }

      function hn() {
        var r, e, u;
        return r = Re, oe.test(t.charAt(Re)) ? (e = t.charAt(Re), Re++) : (e = n,  Ne(fe)), e !== n ? (ie.test(t.charAt(Re)) ? (u = t.charAt(Re), Re++) : (u = n,  Ne(he)), u !== n ? (Xe = r, r = e = le(e, u)) : (Re = r, r = n)) : (Re = r, r = n), r === n && (Ae.test(t.charAt(Re)) ? (r = t.charAt(Re), Re++) : (r = n,  Ne(pe))), r;
      }

      function ln() {
        var r;
        return (r = hn()) === n && (95 === t.charCodeAt(Re) ? (r = de, Re++) : (r = n,  Ne(ge))), r;
      }

      function An() {
        var r;
        return (r = ln()) === n && (45 === t.charCodeAt(Re) ? (r = Tt, Re++) : (r = n,  Ne(qt)), r === n && (_t.test(t.charAt(Re)) ? (r = t.charAt(Re), Re++) : (r = n,  Ne(kt)), r === n && (183 === t.charCodeAt(Re) ? (r = ve, Re++) : (r = n,  Ne(we)), r === n && (be.test(t.charAt(Re)) ? (r = t.charAt(Re), Re++) : (r = n,  Ne(Ce)), r === n && (xe.test(t.charAt(Re)) ? (r = t.charAt(Re), Re++) : (r = n,  Ne(Fe))))))), r;
      }

      function pn() {
        var r, e, u, s, a, f, i, h, l;

        if (r = Re, e = Re, (u = hn()) !== n) {
          for (s = [], a = An(); a !== n;) {
            s.push(a), a = An();
          }

          if (s !== n) {
            if (a = [], f = Re, i = [], 46 === t.charCodeAt(Re) ? (h = c, Re++) : (h = n,  Ne(o)), h !== n) for (; h !== n;) {
              i.push(h), 46 === t.charCodeAt(Re) ? (h = c, Re++) : (h = n,  Ne(o));
            } else i = n;

            if (i !== n) {
              if (h = [], (l = An()) !== n) for (; l !== n;) {
                h.push(l), l = An();
              } else h = n;
              h !== n ? f = i = [i, h] : (Re = f, f = n);
            } else Re = f, f = n;

            for (; f !== n;) {
              if (a.push(f), f = Re, i = [], 46 === t.charCodeAt(Re) ? (h = c, Re++) : (h = n,  Ne(o)), h !== n) for (; h !== n;) {
                i.push(h), 46 === t.charCodeAt(Re) ? (h = c, Re++) : (h = n,  Ne(o));
              } else i = n;

              if (i !== n) {
                if (h = [], (l = An()) !== n) for (; l !== n;) {
                  h.push(l), l = An();
                } else h = n;
                h !== n ? f = i = [i, h] : (Re = f, f = n);
              } else Re = f, f = n;
            }

            a !== n ? e = u = [u, s, a] : (Re = e, e = n);
          } else Re = e, e = n;
        } else Re = e, e = n;

        return r = e !== n ? t.substring(r, Re) : e;
      }

      function dn() {
        var r;
        return (r = function () {
          var r, e, u, s, a;
          r = Re, e = Re, 37 === t.charCodeAt(Re) ? (u = Se, Re++) : (u = n,  Ne(je));
          u !== n && (s = gn()) !== n && (a = gn()) !== n ? e = u = [u, s, a] : (Re = e, e = n);
          r = e !== n ? t.substring(r, Re) : e;
          return r;
        }()) === n && (r = function () {
          var r, e, u;
          r = Re, 92 === t.charCodeAt(Re) ? (e = $e, Re++) : (e = n,  Ne(De));
          e !== n ? (Le.test(t.charAt(Re)) ? (u = t.charAt(Re), Re++) : (u = n,  Ne(Me)), u !== n ? (Xe = r, e = f(u), r = e) : (Re = r, r = n)) : (Re = r, r = n);
          return r;
        }()), r;
      }

      function gn() {
        var r;
        return Ee.test(t.charAt(Re)) ? (r = t.charAt(Re), Re++) : (r = n,  Ne(Ie)), r;
      }

      var vn = {
        base: [],
        data: {},
        addBase: function addBase(t) {
          if (0 === vn.base.length) return void vn.base.push(t);
          var r = vn.base[vn.base.length - 1];
          r !== t && vn.base.push(new URL(t, r).toString());
        },
        addPrefix: function addPrefix(t, r) {
          var e = vn.data[t];
          void 0 === e ? vn.data[t] = [{
            uri: r,
            count: 0
          }] : e[e.length - 1].uri !== r && e.push({
            uri: r,
            count: 0
          });
        },
        hasPrefix: function hasPrefix(t) {
          return void 0 !== this.data[t];
        },
        resolve: function resolve(t, e) {
          var n = Object.keys(vn.data).find(r => 0 === t.indexOf(r + ":"));

          if (void 0 !== n) {
            var _r2 = vn.data[n];
            if (1 === _r2.length && !0 !== e) return t;
            var _u = _r2[_r2.length - 1].uri;
            return t.replace(n + ":", _u);
          }

          var u = 0 === vn.base.length ? r.baseIRI : vn.base[vn.base.length - 1];
          return !u || t.match(/^(http:|https:|urn:|file:)/) ? t : 0 === t.indexOf("//") && u ? u.split("//")[0] + t : new URL(t, u).toString();
        },
        increment: function increment(t) {
          var r = vn.data[t];
          void 0 !== r && r[r.length - 1].count++;
        },
        decrement: function decrement(t) {
          var r = vn.data[t];
          void 0 !== r && r[r.length - 1].count--;
        },
        toJSON: function toJSON() {
          var t = {};
          return vn.base.length > 0 && (void 0 === t["@context"] && (t["@context"] = {}), t["@context"]["@base"] = vn.base[0]), Object.keys(vn.data).forEach(r => {
            var e = vn.data[r][0];
            "http://www.w3.org/2001/XMLSchema#" === e.uri && e.count < 1 || (void 0 === t["@context"] && (t["@context"] = {}), t["@context"][r] = e.uri);
          }), t;
        }
      };

      function wn(t, r) {
        if (void 0 === t["@list"]) return t;
        if (!r && !t["@list"].find(t => void 0 !== t["@list"])) return t;
        if (0 === t["@list"].length) return {
          "@id": "http://www.w3.org/1999/02/22-rdf-syntax-ns#nil"
        };
        var e = {},
            n = null;
        return t["@list"].forEach(t => {
          null === n ? n = e : (n["http://www.w3.org/1999/02/22-rdf-syntax-ns#rest"] = {}, n = n["http://www.w3.org/1999/02/22-rdf-syntax-ns#rest"]), n["http://www.w3.org/1999/02/22-rdf-syntax-ns#first"] = wn(t, !0), n["http://www.w3.org/1999/02/22-rdf-syntax-ns#rest"] = {
            "@id": "http://www.w3.org/1999/02/22-rdf-syntax-ns#nil"
          };
        }), e;
      }

      if ((e = s()) !== n && Re === t.length) return e;
      throw e !== n && Re < t.length && Ne({
        type: "end"
      }), Te(ze, Pe < t.length ? t.charAt(Pe) : null, Pe < t.length ? Je(Pe, Pe + 1) : Je(Pe, Pe));
    }

    peg$subclass(peg$SyntaxError, Error), peg$SyntaxError.buildMessage = function (t, r) {
      var e = {
        literal: function literal(t) {
          return '"' + u(t.text) + '"';
        },
        class: function _class(t) {
          var r,
              e = "";

          for (r = 0; r < t.parts.length; r++) {
            e += t.parts[r] instanceof Array ? s(t.parts[r][0]) + "-" + s(t.parts[r][1]) : s(t.parts[r]);
          }

          return "[" + (t.inverted ? "^" : "") + e + "]";
        },
        any: function any(t) {
          return "any character";
        },
        end: function end(t) {
          return "end of input";
        },
        other: function other(t) {
          return t.description;
        }
      };

      function n(t) {
        return t.charCodeAt(0).toString(16).toUpperCase();
      }

      function u(t) {
        return t.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\0/g, "\\0").replace(/\t/g, "\\t").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/[\x00-\x0F]/g, function (t) {
          return "\\x0" + n(t);
        }).replace(/[\x10-\x1F\x7F-\x9F]/g, function (t) {
          return "\\x" + n(t);
        });
      }

      function s(t) {
        return t.replace(/\\/g, "\\\\").replace(/\]/g, "\\]").replace(/\^/g, "\\^").replace(/-/g, "\\-").replace(/\0/g, "\\0").replace(/\t/g, "\\t").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/[\x00-\x0F]/g, function (t) {
          return "\\x0" + n(t);
        }).replace(/[\x10-\x1F\x7F-\x9F]/g, function (t) {
          return "\\x" + n(t);
        });
      }

      return "Expected " + function (t) {
        var r,
            n,
            u,
            s = new Array(t.length);

        for (r = 0; r < t.length; r++) {
          s[r] = (u = t[r], e[u.type](u));
        }

        if (s.sort(), s.length > 0) {
          for (r = 1, n = 1; r < s.length; r++) {
            s[r - 1] !== s[r] && (s[n] = s[r], n++);
          }

          s.length = n;
        }

        switch (s.length) {
          case 1:
            return s[0];

          case 2:
            return s[0] + " or " + s[1];

          default:
            return s.slice(0, -1).join(", ") + ", or " + s[s.length - 1];
        }
      }(t) + " but " + function (t) {
        return t ? '"' + u(t) + '"' : "end of input";
      }(r) + " found.";
    };
    var ttl2jsonld = peg$parse;

    var lastPart = text => {
      return text.split(/\:|\/|\,|\#/).pop();
    };

    var expand = (binding, context) => {
      var bindingSplit = binding.split(':');

      if (context[bindingSplit[0]]) {
        binding = context[bindingSplit[0]] + bindingSplit[1];
      }

      return binding;
    };

    var JsonLdProxy = function JsonLdProxy(data, context, extraCommands, defaultAlias) {
      if (extraCommands === void 0) {
        extraCommands = {};
      }

      if (defaultAlias === void 0) {
        defaultAlias = null;
      }

      if (typeof data !== 'object') return data;

      var convertProp = prop => {
        if (prop.toString().includes(':')) {
          var propSplit = prop.toString().split(':');

          if (context != null && context[propSplit[0]]) {
            prop = prop.toString().replace(propSplit[0] + ':', context[propSplit[0]]);
          }
        }

        return prop;
      };

      return new Proxy(data, {
        get(target, prop, receiver) {
          var _target$prop, _target$prop$;

          if (prop === '_proxyType') return 'JsonLdProxy';
          prop = convertProp(prop);
          if (prop === '$' && !('$' in extraCommands)) return target;
          if (prop === '_alias') return defaultAlias;

          if (prop === '_' && !('_' in extraCommands)) {
            var getFirst = thing => {
              var _ref, _thing$Id;

              return Array.isArray(thing) ? getFirst(thing[0]) : (_ref = (_thing$Id = thing == null ? void 0 : thing['@id']) != null ? _thing$Id : thing == null ? void 0 : thing['@value']) != null ? _ref : thing;
            };

            return JsonLdProxy(getFirst(target), context, extraCommands, defaultAlias);
          }

          if (prop === 'isProxy') return true;

          for (var [command, callback] of Object.entries(extraCommands)) {
            if (prop === command) return callback(target);
          }

          if (prop[0] === '*') {
            var lastPartToFind = prop.toString().substr(1);

            for (var key of Object.keys(target)) {
              if (lastPart(key) === lastPartToFind) {
                prop = key;
              }
            }
          }

          var isOurProperty = !Reflect.has({}, prop) && !Reflect.has([], prop) && Reflect.has(target, prop);

          if (defaultAlias && !prop.toString().includes(':') && !Reflect.has({}, prop) && !Reflect.has([], prop)) {
            var newProp = convertProp(defaultAlias + ':' + prop.toString());

            var _isOurProperty = !Reflect.has({}, newProp) && !Reflect.has([], newProp) && Reflect.has(target, newProp);

            if (_isOurProperty && Reflect.has(target, newProp)) {
              return JsonLdProxy(target[newProp], context, extraCommands, defaultAlias);
            }
          }

          if ((_target$prop = target[prop]) != null && (_target$prop$ = _target$prop[0]) != null && _target$prop$['@list'] && isOurProperty) {
            return JsonLdProxy(target[prop][0]['@list'], context, extraCommands, defaultAlias);
          }

          if (isOurProperty && target[prop]) {
            return JsonLdProxy(target[prop], context, extraCommands, defaultAlias);
          }

          if (['filter'].includes(prop.toString())) {
            var requestedMethod = Reflect.get(target, prop, receiver);
            return function () {
              for (var _len = arguments.length, input = new Array(_len), _key = 0; _key < _len; _key++) {
                input[_key] = arguments[_key];
              }

              return requestedMethod.apply(target.map(item => JsonLdProxy(item, context, extraCommands, defaultAlias)), input);
            };
          }

          return Reflect.get(target, prop, receiver);
        },

        set(target, prop, value) {
          prop = convertProp(prop);
          target[prop] = value;
          return true;
        }

      });
    };

    class TranslatedText extends Hole {
      constructor(type, template, values) {
        if (template === void 0) {
          template = [];
        }

        if (values === void 0) {
          values = [];
        }

        super(type, template, values);
        var text = type;
        var context = template;
        this.text = text;
        this.template = [text];
        this.values = [];
        this.context = context;
        this.type = 'html';
      }

      toString() {
        return this.text;
      }

    }

    function mixString(a, b, asCodeString) {
      if (asCodeString === void 0) {
        asCodeString = false;
      }

      var total = Math.max(a.length, b.length);
      var string = '';

      for (var part = 0; part < total; part++) {
        var valueString = '';

        if (typeof b[part] === 'object') {
          var keys = Object.keys(b[part]);
          valueString = asCodeString ? '{' + keys[0] + '}' : b[part][keys[0]];
        } else if (typeof b[part] === 'string') {
          valueString = b[part];
        }

        string += a[part] + valueString;
      }

      return string;
    }

    function I18n(_x, _x2, _x3, _x4) {
      return _I18n.apply(this, arguments);
    }

    function _I18n() {
      _I18n = _asyncToGenerator(function* (language, prefix, possibleLanguageCodes, skipImportLanguage) {
        if (prefix === void 0) {
          prefix = '';
        }

        if (skipImportLanguage === void 0) {
          skipImportLanguage = 'en';
        }

        var translations = {};
        translations[language] = {};

        if (possibleLanguageCodes.includes(language) && language !== skipImportLanguage) {
          try {
            var filePath = "/js/Translations/" + ((prefix ? prefix + '.' : '') + language) + ".js";
            translations[language] = (yield import(filePath)).Translations;
          } catch (exception) {
            console.info(exception);
          }
        }

        function Translate(context) {
          if (typeof context === 'string') {
            return function (strings) {
              for (var _len2 = arguments.length, values = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
                values[_key2 - 1] = arguments[_key2];
              }

              var translatedText = Translate(strings, ...values);
              translatedText.context = context;
              return translatedText;
            };
          } else {
            var stringsToTranslate = context;

            for (var _len = arguments.length, values = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
              values[_key - 1] = arguments[_key];
            }

            var codeString = mixString(stringsToTranslate, values, true);

            if (typeof translations[language][codeString] === 'undefined') {
              return new TranslatedText(mixString(stringsToTranslate, values));
            } else {
              var translatedString = translations[language][codeString];
              var tokens = Object.assign({}, ...values);
              var replacements = translatedString.match(/{[a-zA-Z]*}/g);

              if (replacements) {
                replacements.forEach(replacement => {
                  var variableName = replacement.substr(1).substr(0, replacement.length - 2);
                  translatedString = translatedString.replace(replacement, tokens[variableName]);
                });
              }

              return new TranslatedText(translatedString);
            }
          }
        }

        Translate.constructor.prototype.direct = variable => {
          if (typeof translations[language][variable] === 'undefined') {
            return new TranslatedText(variable);
          } else {
            return new TranslatedText(translations[language][variable]);
          }
        };

        return Translate;
      });
      return _I18n.apply(this, arguments);
    }

    var languages = [["aa", "Afar"], ["ab", "Abkhazian"], ["ae", "Avestan"], ["af", "Afrikaans"], ["ak", "Akan"], ["am", "Amharic"], ["an", "Aragonese"], ["ar", "Arabic"], ["as", "Assamese"], ["av", "Avaric"], ["ay", "Aymara"], ["az", "Azerbaijani"], ["ba", "Bashkir"], ["be", "Belarusian"], ["bg", "Bulgarian"], ["bh", "Bihari languages"], ["bi", "Bislama"], ["bm", "Bambara"], ["bn", "Bengali, Bangla"], ["bo", "Tibetan"], ["br", "Breton"], ["bs", "Bosnian"], ["ca", "Catalan, Valencian"], ["ce", "Chechen"], ["ch", "Chamorro"], ["co", "Corsican"], ["cr", "Cree"], ["cs", "Czech"], ["cu", "Church Slavic, Church Slavonic, Old Bulgarian, Old Church Slavonic, Old Slavonic"], ["cv", "Chuvash"], ["cy", "Welsh"], ["da", "Danish"], ["de", "German"], ["dv", "Dhivehi, Divehi, Maldivian"], ["dz", "Dzongkha"], ["ee", "Ewe"], ["el", "Modern Greek (1453-)"], ["en", "English"], ["eo", "Esperanto"], ["es", "Spanish, Castilian"], ["et", "Estonian"], ["eu", "Basque"], ["fa", "Persian"], ["ff", "Fulah"], ["fi", "Finnish"], ["fj", "Fijian"], ["fo", "Faroese"], ["fr", "French"], ["fy", "Western Frisian"], ["ga", "Irish"], ["gd", "Scottish Gaelic, Gaelic"], ["gl", "Galician"], ["gn", "Guarani"], ["gu", "Gujarati"], ["gv", "Manx"], ["ha", "Hausa"], ["he", "Hebrew"], ["hi", "Hindi"], ["ho", "Hiri Motu"], ["hr", "Croatian"], ["ht", "Haitian, Haitian Creole"], ["hu", "Hungarian"], ["hy", "Armenian"], ["hz", "Herero"], ["ia", "Interlingua (International Auxiliary Language Association)"], ["id", "Indonesian"], ["ie", "Interlingue, Occidental"], ["ig", "Igbo"], ["ii", "Sichuan Yi, Nuosu"], ["ik", "Inupiaq"], ["in", "Indonesian"], ["io", "Ido"], ["is", "Icelandic"], ["it", "Italian"], ["iu", "Inuktitut"], ["iw", "Hebrew"], ["ja", "Japanese"], ["ji", "Yiddish"], ["jv", "Javanese"], ["jw", "Javanese"], ["ka", "Georgian"], ["kg", "Kongo"], ["ki", "Kikuyu, Gikuyu"], ["kj", "Kuanyama, Kwanyama"], ["kk", "Kazakh"], ["kl", "Kalaallisut, Greenlandic"], ["km", "Khmer, Central Khmer"], ["kn", "Kannada"], ["ko", "Korean"], ["kr", "Kanuri"], ["ks", "Kashmiri"], ["ku", "Kurdish"], ["kv", "Komi"], ["kw", "Cornish"], ["ky", "Kirghiz, Kyrgyz"], ["la", "Latin"], ["lb", "Luxembourgish, Letzeburgesch"], ["lg", "Ganda, Luganda"], ["li", "Limburgan, Limburger, Limburgish"], ["ln", "Lingala"], ["lo", "Lao"], ["lt", "Lithuanian"], ["lu", "Luba-Katanga"], ["lv", "Latvian"], ["mg", "Malagasy"], ["mh", "Marshallese"], ["mi", "Maori"], ["mk", "Macedonian"], ["ml", "Malayalam"], ["mn", "Mongolian"], ["mo", "Moldavian, Moldovan"], ["mr", "Marathi"], ["ms", "Malay (macrolanguage)"], ["mt", "Maltese"], ["my", "Burmese"], ["na", "Nauru"], ["nb", "Norwegian Bokmål"], ["nd", "North Ndebele"], ["ne", "Nepali (macrolanguage)"], ["ng", "Ndonga"], ["nl", "Dutch, Flemish"], ["nn", "Norwegian Nynorsk"], ["no", "Norwegian"], ["nr", "South Ndebele"], ["nv", "Navajo, Navaho"], ["ny", "Nyanja, Chewa, Chichewa"], ["oc", "Occitan (post 1500)"], ["oj", "Ojibwa"], ["om", "Oromo"], ["or", "Oriya (macrolanguage), Odia (macrolanguage)"], ["os", "Ossetian, Ossetic"], ["pa", "Panjabi, Punjabi"], ["pi", "Pali"], ["pl", "Polish"], ["ps", "Pushto, Pashto"], ["pt", "Portuguese"], ["qu", "Quechua"], ["rm", "Romansh"], ["rn", "Rundi"], ["ro", "Romanian, Moldavian, Moldovan"], ["ru", "Russian"], ["rw", "Kinyarwanda"], ["sa", "Sanskrit"], ["sc", "Sardinian"], ["sd", "Sindhi"], ["se", "Northern Sami"], ["sg", "Sango"], ["sh", "Serbo-Croatian"], ["si", "Sinhala, Sinhalese"], ["sk", "Slovak"], ["sl", "Slovenian"], ["sm", "Samoan"], ["sn", "Shona"], ["so", "Somali"], ["sq", "Albanian"], ["sr", "Serbian"], ["ss", "Swati"], ["st", "Southern Sotho"], ["su", "Sundanese"], ["sv", "Swedish"], ["sw", "Swahili (macrolanguage)"], ["ta", "Tamil"], ["te", "Telugu"], ["tg", "Tajik"], ["th", "Thai"], ["ti", "Tigrinya"], ["tk", "Turkmen"], ["tl", "Tagalog"], ["tn", "Tswana"], ["to", "Tonga (Tonga Islands)"], ["tr", "Turkish"], ["ts", "Tsonga"], ["tt", "Tatar"], ["tw", "Twi"], ["ty", "Tahitian"], ["ug", "Uighur, Uyghur"], ["uk", "Ukrainian"], ["ur", "Urdu"], ["uz", "Uzbek"], ["ve", "Venda"], ["vi", "Vietnamese"], ["vo", "Volapük"], ["wa", "Walloon"], ["wo", "Wolof"], ["xh", "Xhosa"], ["yi", "Yiddish"], ["yo", "Yoruba"], ["za", "Zhuang, Chuang"], ["zh", "Chinese"], ["zu", "Zulu"], ["aaa", "Ghotuo"], ["aab", "Alumu-Tesu"], ["aac", "Ari"], ["aad", "Amal"], ["aae", "Arbëreshë Albanian"], ["aaf", "Aranadan"], ["aag", "Ambrak"], ["aah", "Abu' Arapesh"], ["aai", "Arifama-Miniafia"], ["aak", "Ankave"], ["aal", "Afade"], ["aam", "Aramanik"], ["aan", "Anambé"], ["aao", "Algerian Saharan Arabic"], ["aap", "Pará Arára"], ["aaq", "Eastern Abnaki"], ["aas", "Aasáx"], ["aat", "Arvanitika Albanian"], ["aau", "Abau"], ["aav", "Austro-Asiatic languages"], ["aaw", "Solong"], ["aax", "Mandobo Atas"], ["aaz", "Amarasi"], ["aba", "Abé"], ["abb", "Bankon"], ["abc", "Ambala Ayta"], ["abd", "Manide"], ["abe", "Western Abnaki"], ["abf", "Abai Sungai"], ["abg", "Abaga"], ["abh", "Tajiki Arabic"], ["abi", "Abidji"], ["abj", "Aka-Bea"], ["abl", "Lampung Nyo"], ["abm", "Abanyom"], ["abn", "Abua"], ["abo", "Abon"], ["abp", "Abellen Ayta"], ["abq", "Abaza"], ["abr", "Abron"], ["abs", "Ambonese Malay"], ["abt", "Ambulas"], ["abu", "Abure"], ["abv", "Baharna Arabic"], ["abw", "Pal"], ["abx", "Inabaknon"], ["aby", "Aneme Wake"], ["abz", "Abui"], ["aca", "Achagua"], ["acb", "Áncá"], ["acd", "Gikyode"], ["ace", "Achinese"], ["acf", "Saint Lucian Creole French"], ["ach", "Acoli"], ["aci", "Aka-Cari"], ["ack", "Aka-Kora"], ["acl", "Akar-Bale"], ["acm", "Mesopotamian Arabic"], ["acn", "Achang"], ["acp", "Eastern Acipa"], ["acq", "Ta'izzi-Adeni Arabic"], ["acr", "Achi"], ["acs", "Acroá"], ["act", "Achterhoeks"], ["acu", "Achuar-Shiwiar"], ["acv", "Achumawi"], ["acw", "Hijazi Arabic"], ["acx", "Omani Arabic"], ["acy", "Cypriot Arabic"], ["acz", "Acheron"], ["ada", "Adangme"], ["adb", "Atauran"], ["add", "Lidzonka, Dzodinka"], ["ade", "Adele"], ["adf", "Dhofari Arabic"], ["adg", "Andegerebinha"], ["adh", "Adhola"], ["adi", "Adi"], ["adj", "Adioukrou"], ["adl", "Galo"], ["adn", "Adang"], ["ado", "Abu"], ["adp", "Adap"], ["adq", "Adangbe"], ["adr", "Adonara"], ["ads", "Adamorobe Sign Language"], ["adt", "Adnyamathanha"], ["adu", "Aduge"], ["adw", "Amundava"], ["adx", "Amdo Tibetan"], ["ady", "Adyghe, Adygei"], ["adz", "Adzera"], ["aea", "Areba"], ["aeb", "Tunisian Arabic"], ["aec", "Saidi Arabic"], ["aed", "Argentine Sign Language"], ["aee", "Northeast Pashai, Northeast Pashayi"], ["aek", "Haeke"], ["ael", "Ambele"], ["aem", "Arem"], ["aen", "Armenian Sign Language"], ["aeq", "Aer"], ["aer", "Eastern Arrernte"], ["aes", "Alsea"], ["aeu", "Akeu"], ["aew", "Ambakich"], ["aey", "Amele"], ["aez", "Aeka"], ["afa", "Afro-Asiatic languages"], ["afb", "Gulf Arabic"], ["afd", "Andai"], ["afe", "Putukwam"], ["afg", "Afghan Sign Language"], ["afh", "Afrihili"], ["afi", "Akrukay, Chini"], ["afk", "Nanubae"], ["afn", "Defaka"], ["afo", "Eloyi"], ["afp", "Tapei"], ["afs", "Afro-Seminole Creole"], ["aft", "Afitti"], ["afu", "Awutu"], ["afz", "Obokuitai"], ["aga", "Aguano"], ["agb", "Legbo"], ["agc", "Agatu"], ["agd", "Agarabi"], ["age", "Angal"], ["agf", "Arguni"], ["agg", "Angor"], ["agh", "Ngelima"], ["agi", "Agariya"], ["agj", "Argobba"], ["agk", "Isarog Agta"], ["agl", "Fembe"], ["agm", "Angaataha"], ["agn", "Agutaynen"], ["ago", "Tainae"], ["agp", "Paranan"], ["agq", "Aghem"], ["agr", "Aguaruna"], ["ags", "Esimbi"], ["agt", "Central Cagayan Agta"], ["agu", "Aguacateco"], ["agv", "Remontado Dumagat"], ["agw", "Kahua"], ["agx", "Aghul"], ["agy", "Southern Alta"], ["agz", "Mt. Iriga Agta"], ["aha", "Ahanta"], ["ahb", "Axamb"], ["ahg", "Qimant"], ["ahh", "Aghu"], ["ahi", "Tiagbamrin Aizi"], ["ahk", "Akha"], ["ahl", "Igo"], ["ahm", "Mobumrin Aizi"], ["ahn", "Àhàn"], ["aho", "Ahom"], ["ahp", "Aproumu Aizi"], ["ahr", "Ahirani"], ["ahs", "Ashe"], ["aht", "Ahtena"], ["aia", "Arosi"], ["aib", "Ainu (China)"], ["aic", "Ainbai"], ["aid", "Alngith"], ["aie", "Amara"], ["aif", "Agi"], ["aig", "Antigua and Barbuda Creole English"], ["aih", "Ai-Cham"], ["aii", "Assyrian Neo-Aramaic"], ["aij", "Lishanid Noshan"], ["aik", "Ake"], ["ail", "Aimele"], ["aim", "Aimol"], ["ain", "Ainu (Japan)"], ["aio", "Aiton"], ["aip", "Burumakok"], ["aiq", "Aimaq"], ["air", "Airoran"], ["ais", "Nataoran Amis"], ["ait", "Arikem"], ["aiw", "Aari"], ["aix", "Aighon"], ["aiy", "Ali"], ["aja", "Aja (South Sudan)"], ["ajg", "Aja (Benin)"], ["aji", "Ajië"], ["ajn", "Andajin"], ["ajp", "South Levantine Arabic"], ["ajt", "Judeo-Tunisian Arabic"], ["aju", "Judeo-Moroccan Arabic"], ["ajw", "Ajawa"], ["ajz", "Amri Karbi"], ["akb", "Batak Angkola"], ["akc", "Mpur"], ["akd", "Ukpet-Ehom"], ["ake", "Akawaio"], ["akf", "Akpa"], ["akg", "Anakalangu"], ["akh", "Angal Heneng"], ["aki", "Aiome"], ["akj", "Aka-Jeru"], ["akk", "Akkadian"], ["akl", "Aklanon"], ["akm", "Aka-Bo"], ["ako", "Akurio"], ["akp", "Siwu"], ["akq", "Ak"], ["akr", "Araki"], ["aks", "Akaselem"], ["akt", "Akolet"], ["aku", "Akum"], ["akv", "Akhvakh"], ["akw", "Akwa"], ["akx", "Aka-Kede"], ["aky", "Aka-Kol"], ["akz", "Alabama"], ["ala", "Alago"], ["alc", "Qawasqar"], ["ald", "Alladian"], ["ale", "Aleut"], ["alf", "Alege"], ["alg", "Algonquian languages"], ["alh", "Alawa"], ["ali", "Amaimon"], ["alj", "Alangan"], ["alk", "Alak"], ["all", "Allar"], ["alm", "Amblong"], ["aln", "Gheg Albanian"], ["alo", "Larike-Wakasihu"], ["alp", "Alune"], ["alq", "Algonquin"], ["alr", "Alutor"], ["als", "Tosk Albanian"], ["alt", "Southern Altai"], ["alu", "'Are'are"], ["alv", "Atlantic-Congo languages"], ["alw", "Alaba-K’abeena, Wanbasana"], ["alx", "Amol"], ["aly", "Alyawarr"], ["alz", "Alur"], ["ama", "Amanayé"], ["amb", "Ambo"], ["amc", "Amahuaca"], ["ame", "Yanesha'"], ["amf", "Hamer-Banna"], ["amg", "Amurdak"], ["ami", "Amis"], ["amj", "Amdang"], ["amk", "Ambai"], ["aml", "War-Jaintia"], ["amm", "Ama (Papua New Guinea)"], ["amn", "Amanab"], ["amo", "Amo"], ["amp", "Alamblak"], ["amq", "Amahai"], ["amr", "Amarakaeri"], ["ams", "Southern Amami-Oshima"], ["amt", "Amto"], ["amu", "Guerrero Amuzgo"], ["amv", "Ambelau"], ["amw", "Western Neo-Aramaic"], ["amx", "Anmatyerre"], ["amy", "Ami"], ["amz", "Atampaya"], ["ana", "Andaqui"], ["anb", "Andoa"], ["anc", "Ngas"], ["and", "Ansus"], ["ane", "Xârâcùù"], ["anf", "Animere"], ["ang", "Old English (ca. 450-1100)"], ["anh", "Nend"], ["ani", "Andi"], ["anj", "Anor"], ["ank", "Goemai"], ["anl", "Anu-Hkongso Chin"], ["anm", "Anal"], ["ann", "Obolo"], ["ano", "Andoque"], ["anp", "Angika"], ["anq", "Jarawa (India)"], ["anr", "Andh"], ["ans", "Anserma"], ["ant", "Antakarinya, Antikarinya"], ["anu", "Anuak"], ["anv", "Denya"], ["anw", "Anaang"], ["anx", "Andra-Hus"], ["any", "Anyin"], ["anz", "Anem"], ["aoa", "Angolar"], ["aob", "Abom"], ["aoc", "Pemon"], ["aod", "Andarum"], ["aoe", "Angal Enen"], ["aof", "Bragat"], ["aog", "Angoram"], ["aoh", "Arma"], ["aoi", "Anindilyakwa"], ["aoj", "Mufian"], ["aok", "Arhö"], ["aol", "Alor"], ["aom", "Ömie"], ["aon", "Bumbita Arapesh"], ["aor", "Aore"], ["aos", "Taikat"], ["aot", "Atong (India), A'tong"], ["aou", "A'ou"], ["aox", "Atorada"], ["aoz", "Uab Meto"], ["apa", "Apache languages"], ["apb", "Sa'a"], ["apc", "North Levantine Arabic"], ["apd", "Sudanese Arabic"], ["ape", "Bukiyip"], ["apf", "Pahanan Agta"], ["apg", "Ampanang"], ["aph", "Athpariya"], ["api", "Apiaká"], ["apj", "Jicarilla Apache"], ["apk", "Kiowa Apache"], ["apl", "Lipan Apache"], ["apm", "Mescalero-Chiricahua Apache"], ["apn", "Apinayé"], ["apo", "Ambul"], ["app", "Apma"], ["apq", "A-Pucikwar"], ["apr", "Arop-Lokep"], ["aps", "Arop-Sissano"], ["apt", "Apatani"], ["apu", "Apurinã"], ["apv", "Alapmunte"], ["apw", "Western Apache"], ["apx", "Aputai"], ["apy", "Apalaí"], ["apz", "Safeyoka"], ["aqa", "Alacalufan languages"], ["aqc", "Archi"], ["aqd", "Ampari Dogon"], ["aqg", "Arigidi"], ["aqk", "Aninka"], ["aql", "Algic languages"], ["aqm", "Atohwaim"], ["aqn", "Northern Alta"], ["aqp", "Atakapa"], ["aqr", "Arhâ"], ["aqt", "Angaité"], ["aqz", "Akuntsu"], ["arb", "Standard Arabic"], ["arc", "Official Aramaic (700-300 BCE), Imperial Aramaic (700-300 BCE)"], ["ard", "Arabana"], ["are", "Western Arrarnta"], ["arh", "Arhuaco"], ["ari", "Arikara"], ["arj", "Arapaso"], ["ark", "Arikapú"], ["arl", "Arabela"], ["arn", "Mapudungun, Mapuche"], ["aro", "Araona"], ["arp", "Arapaho"], ["arq", "Algerian Arabic"], ["arr", "Karo (Brazil)"], ["ars", "Najdi Arabic"], ["art", "Artificial languages"], ["aru", "Aruá (Amazonas State), Arawá"], ["arv", "Arbore"], ["arw", "Arawak"], ["arx", "Aruá (Rodonia State)"], ["ary", "Moroccan Arabic"], ["arz", "Egyptian Arabic"], ["asa", "Asu (Tanzania)"], ["asb", "Assiniboine"], ["asc", "Casuarina Coast Asmat"], ["asd", "Asas"], ["ase", "American Sign Language"], ["asf", "Auslan, Australian Sign Language"], ["asg", "Cishingini"], ["ash", "Abishira"], ["asi", "Buruwai"], ["asj", "Sari"], ["ask", "Ashkun"], ["asl", "Asilulu"], ["asn", "Xingú Asuriní"], ["aso", "Dano"], ["asp", "Algerian Sign Language"], ["asq", "Austrian Sign Language"], ["asr", "Asuri"], ["ass", "Ipulo"], ["ast", "Asturian, Asturleonese, Bable, Leonese"], ["asu", "Tocantins Asurini"], ["asv", "Asoa"], ["asw", "Australian Aborigines Sign Language"], ["asx", "Muratayak"], ["asy", "Yaosakor Asmat"], ["asz", "As"], ["ata", "Pele-Ata"], ["atb", "Zaiwa"], ["atc", "Atsahuaca"], ["atd", "Ata Manobo"], ["ate", "Atemble"], ["atg", "Ivbie North-Okpela-Arhe"], ["ath", "Athapascan languages"], ["ati", "Attié"], ["atj", "Atikamekw"], ["atk", "Ati"], ["atl", "Mt. Iraya Agta"], ["atm", "Ata"], ["atn", "Ashtiani"], ["ato", "Atong (Cameroon)"], ["atp", "Pudtol Atta"], ["atq", "Aralle-Tabulahan"], ["atr", "Waimiri-Atroari"], ["ats", "Gros Ventre"], ["att", "Pamplona Atta"], ["atu", "Reel"], ["atv", "Northern Altai"], ["atw", "Atsugewi"], ["atx", "Arutani"], ["aty", "Aneityum"], ["atz", "Arta"], ["aua", "Asumboa"], ["aub", "Alugu"], ["auc", "Waorani"], ["aud", "Anuta"], ["aue", "ǂKxʼauǁʼein"], ["auf", "Arauan languages"], ["aug", "Aguna"], ["auh", "Aushi"], ["aui", "Anuki"], ["auj", "Awjilah"], ["auk", "Heyo"], ["aul", "Aulua"], ["aum", "Asu (Nigeria)"], ["aun", "Molmo One"], ["auo", "Auyokawa"], ["aup", "Makayam"], ["auq", "Anus, Korur"], ["aur", "Aruek"], ["aus", "Australian languages"], ["aut", "Austral"], ["auu", "Auye"], ["auw", "Awyi"], ["aux", "Aurá"], ["auy", "Awiyaana"], ["auz", "Uzbeki Arabic"], ["avb", "Avau"], ["avd", "Alviri-Vidari"], ["avi", "Avikam"], ["avk", "Kotava"], ["avl", "Eastern Egyptian Bedawi Arabic"], ["avm", "Angkamuthi"], ["avn", "Avatime"], ["avo", "Agavotaguerra"], ["avs", "Aushiri"], ["avt", "Au"], ["avu", "Avokaya"], ["avv", "Avá-Canoeiro"], ["awa", "Awadhi"], ["awb", "Awa (Papua New Guinea)"], ["awc", "Cicipu"], ["awd", "Arawakan languages"], ["awe", "Awetí"], ["awg", "Anguthimri"], ["awh", "Awbono"], ["awi", "Aekyom"], ["awk", "Awabakal"], ["awm", "Arawum"], ["awn", "Awngi"], ["awo", "Awak"], ["awr", "Awera"], ["aws", "South Awyu"], ["awt", "Araweté"], ["awu", "Central Awyu"], ["awv", "Jair Awyu"], ["aww", "Awun"], ["awx", "Awara"], ["awy", "Edera Awyu"], ["axb", "Abipon"], ["axe", "Ayerrerenge"], ["axg", "Mato Grosso Arára"], ["axk", "Yaka (Central African Republic)"], ["axl", "Lower Southern Aranda"], ["axm", "Middle Armenian"], ["axx", "Xârâgurè"], ["aya", "Awar"], ["ayb", "Ayizo Gbe"], ["ayc", "Southern Aymara"], ["ayd", "Ayabadhu"], ["aye", "Ayere"], ["ayg", "Ginyanga"], ["ayh", "Hadrami Arabic"], ["ayi", "Leyigha"], ["ayk", "Akuku"], ["ayl", "Libyan Arabic"], ["ayn", "Sanaani Arabic"], ["ayo", "Ayoreo"], ["ayp", "North Mesopotamian Arabic"], ["ayq", "Ayi (Papua New Guinea)"], ["ayr", "Central Aymara"], ["ays", "Sorsogon Ayta"], ["ayt", "Magbukun Ayta"], ["ayu", "Ayu"], ["ayx", "Ayi (China)"], ["ayy", "Tayabas Ayta"], ["ayz", "Mai Brat"], ["aza", "Azha"], ["azb", "South Azerbaijani"], ["azc", "Uto-Aztecan languages"], ["azd", "Eastern Durango Nahuatl"], ["azg", "San Pedro Amuzgos Amuzgo"], ["azj", "North Azerbaijani"], ["azm", "Ipalapa Amuzgo"], ["azn", "Western Durango Nahuatl"], ["azo", "Awing"], ["azt", "Faire Atta"], ["azz", "Highland Puebla Nahuatl"], ["baa", "Babatana"], ["bab", "Bainouk-Gunyuño"], ["bac", "Badui"], ["bad", "Banda languages"], ["bae", "Baré"], ["baf", "Nubaca"], ["bag", "Tuki"], ["bah", "Bahamas Creole English"], ["bai", "Bamileke languages"], ["baj", "Barakai"], ["bal", "Baluchi"], ["ban", "Balinese"], ["bao", "Waimaha"], ["bap", "Bantawa"], ["bar", "Bavarian"], ["bas", "Basa (Cameroon)"], ["bat", "Baltic languages"], ["bau", "Bada (Nigeria)"], ["bav", "Vengo"], ["baw", "Bambili-Bambui"], ["bax", "Bamun"], ["bay", "Batuley"], ["baz", "Tunen"], ["bba", "Baatonum"], ["bbb", "Barai"], ["bbc", "Batak Toba"], ["bbd", "Bau"], ["bbe", "Bangba"], ["bbf", "Baibai"], ["bbg", "Barama"], ["bbh", "Bugan"], ["bbi", "Barombi"], ["bbj", "Ghomálá'"], ["bbk", "Babanki"], ["bbl", "Bats"], ["bbm", "Babango"], ["bbn", "Uneapa"], ["bbo", "Northern Bobo Madaré, Konabéré"], ["bbp", "West Central Banda"], ["bbq", "Bamali"], ["bbr", "Girawa"], ["bbs", "Bakpinka"], ["bbt", "Mburku"], ["bbu", "Kulung (Nigeria)"], ["bbv", "Karnai"], ["bbw", "Baba"], ["bbx", "Bubia"], ["bby", "Befang"], ["bbz", "Babalia Creole Arabic"], ["bca", "Central Bai"], ["bcb", "Bainouk-Samik"], ["bcc", "Southern Balochi"], ["bcd", "North Babar"], ["bce", "Bamenyam"], ["bcf", "Bamu"], ["bcg", "Baga Pokur"], ["bch", "Bariai"], ["bci", "Baoulé"], ["bcj", "Bardi"], ["bck", "Bunuba"], ["bcl", "Central Bikol"], ["bcm", "Bannoni"], ["bcn", "Bali (Nigeria)"], ["bco", "Kaluli"], ["bcp", "Bali (Democratic Republic of Congo)"], ["bcq", "Bench"], ["bcr", "Babine"], ["bcs", "Kohumono"], ["bct", "Bendi"], ["bcu", "Awad Bing"], ["bcv", "Shoo-Minda-Nye"], ["bcw", "Bana"], ["bcy", "Bacama"], ["bcz", "Bainouk-Gunyaamolo"], ["bda", "Bayot"], ["bdb", "Basap"], ["bdc", "Emberá-Baudó"], ["bdd", "Bunama"], ["bde", "Bade"], ["bdf", "Biage"], ["bdg", "Bonggi"], ["bdh", "Baka (South Sudan)"], ["bdi", "Burun"], ["bdj", "Bai (South Sudan), Bai"], ["bdk", "Budukh"], ["bdl", "Indonesian Bajau"], ["bdm", "Buduma"], ["bdn", "Baldemu"], ["bdo", "Morom"], ["bdp", "Bende"], ["bdq", "Bahnar"], ["bdr", "West Coast Bajau"], ["bds", "Burunge"], ["bdt", "Bokoto"], ["bdu", "Oroko"], ["bdv", "Bodo Parja"], ["bdw", "Baham"], ["bdx", "Budong-Budong"], ["bdy", "Bandjalang"], ["bdz", "Badeshi"], ["bea", "Beaver"], ["beb", "Bebele"], ["bec", "Iceve-Maci"], ["bed", "Bedoanas"], ["bee", "Byangsi"], ["bef", "Benabena"], ["beg", "Belait"], ["beh", "Biali"], ["bei", "Bekati'"], ["bej", "Beja, Bedawiyet"], ["bek", "Bebeli"], ["bem", "Bemba (Zambia)"], ["beo", "Beami"], ["bep", "Besoa"], ["beq", "Beembe"], ["ber", "Berber languages"], ["bes", "Besme"], ["bet", "Guiberoua Béte"], ["beu", "Blagar"], ["bev", "Daloa Bété"], ["bew", "Betawi"], ["bex", "Jur Modo"], ["bey", "Beli (Papua New Guinea)"], ["bez", "Bena (Tanzania)"], ["bfa", "Bari"], ["bfb", "Pauri Bareli"], ["bfc", "Panyi Bai, Northern Bai"], ["bfd", "Bafut"], ["bfe", "Betaf, Tena"], ["bff", "Bofi"], ["bfg", "Busang Kayan"], ["bfh", "Blafe"], ["bfi", "British Sign Language"], ["bfj", "Bafanji"], ["bfk", "Ban Khor Sign Language"], ["bfl", "Banda-Ndélé"], ["bfm", "Mmen"], ["bfn", "Bunak"], ["bfo", "Malba Birifor"], ["bfp", "Beba"], ["bfq", "Badaga"], ["bfr", "Bazigar"], ["bfs", "Southern Bai"], ["bft", "Balti"], ["bfu", "Gahri"], ["bfw", "Bondo"], ["bfx", "Bantayanon"], ["bfy", "Bagheli"], ["bfz", "Mahasu Pahari"], ["bga", "Gwamhi-Wuri"], ["bgb", "Bobongko"], ["bgc", "Haryanvi"], ["bgd", "Rathwi Bareli"], ["bge", "Bauria"], ["bgf", "Bangandu"], ["bgg", "Bugun"], ["bgi", "Giangan"], ["bgj", "Bangolan"], ["bgk", "Bit, Buxinhua"], ["bgl", "Bo (Laos)"], ["bgm", "Baga Mboteni"], ["bgn", "Western Balochi"], ["bgo", "Baga Koga"], ["bgp", "Eastern Balochi"], ["bgq", "Bagri"], ["bgr", "Bawm Chin"], ["bgs", "Tagabawa"], ["bgt", "Bughotu"], ["bgu", "Mbongno"], ["bgv", "Warkay-Bipim"], ["bgw", "Bhatri"], ["bgx", "Balkan Gagauz Turkish"], ["bgy", "Benggoi"], ["bgz", "Banggai"], ["bha", "Bharia"], ["bhb", "Bhili"], ["bhc", "Biga"], ["bhd", "Bhadrawahi"], ["bhe", "Bhaya"], ["bhf", "Odiai"], ["bhg", "Binandere"], ["bhh", "Bukharic"], ["bhi", "Bhilali"], ["bhj", "Bahing"], ["bhk", "Albay Bicolano"], ["bhl", "Bimin"], ["bhm", "Bathari"], ["bhn", "Bohtan Neo-Aramaic"], ["bho", "Bhojpuri"], ["bhp", "Bima"], ["bhq", "Tukang Besi South"], ["bhr", "Bara Malagasy"], ["bhs", "Buwal"], ["bht", "Bhattiyali"], ["bhu", "Bhunjia"], ["bhv", "Bahau"], ["bhw", "Biak"], ["bhx", "Bhalay"], ["bhy", "Bhele"], ["bhz", "Bada (Indonesia)"], ["bia", "Badimaya"], ["bib", "Bissa, Bisa"], ["bic", "Bikaru"], ["bid", "Bidiyo"], ["bie", "Bepour"], ["bif", "Biafada"], ["big", "Biangai"], ["bij", "Vaghat-Ya-Bijim-Legeri"], ["bik", "Bikol"], ["bil", "Bile"], ["bim", "Bimoba"], ["bin", "Bini, Edo"], ["bio", "Nai"], ["bip", "Bila"], ["biq", "Bipi"], ["bir", "Bisorio"], ["bit", "Berinomo"], ["biu", "Biete"], ["biv", "Southern Birifor"], ["biw", "Kol (Cameroon)"], ["bix", "Bijori"], ["biy", "Birhor"], ["biz", "Baloi"], ["bja", "Budza"], ["bjb", "Banggarla"], ["bjc", "Bariji"], ["bjd", "Bandjigali"], ["bje", "Biao-Jiao Mien"], ["bjf", "Barzani Jewish Neo-Aramaic"], ["bjg", "Bidyogo"], ["bjh", "Bahinemo"], ["bji", "Burji"], ["bjj", "Kanauji"], ["bjk", "Barok"], ["bjl", "Bulu (Papua New Guinea)"], ["bjm", "Bajelani"], ["bjn", "Banjar"], ["bjo", "Mid-Southern Banda"], ["bjp", "Fanamaket"], ["bjq", "Southern Betsimisaraka Malagasy"], ["bjr", "Binumarien"], ["bjs", "Bajan"], ["bjt", "Balanta-Ganja"], ["bju", "Busuu"], ["bjv", "Bedjond"], ["bjw", "Bakwé"], ["bjx", "Banao Itneg"], ["bjy", "Bayali"], ["bjz", "Baruga"], ["bka", "Kyak"], ["bkb", "Finallig"], ["bkc", "Baka (Cameroon)"], ["bkd", "Binukid, Talaandig"], ["bkf", "Beeke"], ["bkg", "Buraka"], ["bkh", "Bakoko"], ["bki", "Baki"], ["bkj", "Pande"], ["bkk", "Brokskat"], ["bkl", "Berik"], ["bkm", "Kom (Cameroon)"], ["bkn", "Bukitan"], ["bko", "Kwa'"], ["bkp", "Boko (Democratic Republic of Congo)"], ["bkq", "Bakairí"], ["bkr", "Bakumpai"], ["bks", "Northern Sorsoganon"], ["bkt", "Boloki"], ["bku", "Buhid"], ["bkv", "Bekwarra"], ["bkw", "Bekwel"], ["bkx", "Baikeno"], ["bky", "Bokyi"], ["bkz", "Bungku"], ["bla", "Siksika"], ["blb", "Bilua"], ["blc", "Bella Coola"], ["bld", "Bolango"], ["ble", "Balanta-Kentohe"], ["blf", "Buol"], ["blg", "Balau"], ["blh", "Kuwaa"], ["bli", "Bolia"], ["blj", "Bolongan"], ["blk", "Pa'o Karen, Pa'O"], ["bll", "Biloxi"], ["blm", "Beli (South Sudan)"], ["bln", "Southern Catanduanes Bikol"], ["blo", "Anii"], ["blp", "Blablanga"], ["blq", "Baluan-Pam"], ["blr", "Blang"], ["bls", "Balaesang"], ["blt", "Tai Dam"], ["blv", "Kibala, Bolo"], ["blw", "Balangao"], ["blx", "Mag-Indi Ayta"], ["bly", "Notre"], ["blz", "Balantak"], ["bma", "Lame"], ["bmb", "Bembe"], ["bmc", "Biem"], ["bmd", "Baga Manduri"], ["bme", "Limassa"], ["bmf", "Bom-Kim"], ["bmg", "Bamwe"], ["bmh", "Kein"], ["bmi", "Bagirmi"], ["bmj", "Bote-Majhi"], ["bmk", "Ghayavi"], ["bml", "Bomboli"], ["bmm", "Northern Betsimisaraka Malagasy"], ["bmn", "Bina (Papua New Guinea)"], ["bmo", "Bambalang"], ["bmp", "Bulgebi"], ["bmq", "Bomu"], ["bmr", "Muinane"], ["bms", "Bilma Kanuri"], ["bmt", "Biao Mon"], ["bmu", "Somba-Siawari"], ["bmv", "Bum"], ["bmw", "Bomwali"], ["bmx", "Baimak"], ["bmy", "Bemba (Democratic Republic of Congo)"], ["bmz", "Baramu"], ["bna", "Bonerate"], ["bnb", "Bookan"], ["bnc", "Bontok"], ["bnd", "Banda (Indonesia)"], ["bne", "Bintauna"], ["bnf", "Masiwang"], ["bng", "Benga"], ["bni", "Bangi"], ["bnj", "Eastern Tawbuid"], ["bnk", "Bierebo"], ["bnl", "Boon"], ["bnm", "Batanga"], ["bnn", "Bunun"], ["bno", "Bantoanon"], ["bnp", "Bola"], ["bnq", "Bantik"], ["bnr", "Butmas-Tur"], ["bns", "Bundeli"], ["bnt", "Bantu languages"], ["bnu", "Bentong"], ["bnv", "Bonerif, Beneraf, Edwas"], ["bnw", "Bisis"], ["bnx", "Bangubangu"], ["bny", "Bintulu"], ["bnz", "Beezen"], ["boa", "Bora"], ["bob", "Aweer"], ["boe", "Mundabli"], ["bof", "Bolon"], ["bog", "Bamako Sign Language"], ["boh", "Boma"], ["boi", "Barbareño"], ["boj", "Anjam"], ["bok", "Bonjo"], ["bol", "Bole"], ["bom", "Berom"], ["bon", "Bine"], ["boo", "Tiemacèwè Bozo"], ["bop", "Bonkiman"], ["boq", "Bogaya"], ["bor", "Borôro"], ["bot", "Bongo"], ["bou", "Bondei"], ["bov", "Tuwuli"], ["bow", "Rema"], ["box", "Buamu"], ["boy", "Bodo (Central African Republic)"], ["boz", "Tiéyaxo Bozo"], ["bpa", "Daakaka"], ["bpb", "Barbacoas"], ["bpd", "Banda-Banda"], ["bpe", "Bauni"], ["bpg", "Bonggo"], ["bph", "Botlikh"], ["bpi", "Bagupi"], ["bpj", "Binji"], ["bpk", "Orowe, 'Ôrôê"], ["bpl", "Broome Pearling Lugger Pidgin"], ["bpm", "Biyom"], ["bpn", "Dzao Min"], ["bpo", "Anasi"], ["bpp", "Kaure"], ["bpq", "Banda Malay"], ["bpr", "Koronadal Blaan"], ["bps", "Sarangani Blaan"], ["bpt", "Barrow Point"], ["bpu", "Bongu"], ["bpv", "Bian Marind"], ["bpw", "Bo (Papua New Guinea)"], ["bpx", "Palya Bareli"], ["bpy", "Bishnupriya"], ["bpz", "Bilba"], ["bqa", "Tchumbuli"], ["bqb", "Bagusa"], ["bqc", "Boko (Benin), Boo"], ["bqd", "Bung"], ["bqf", "Baga Kaloum"], ["bqg", "Bago-Kusuntu"], ["bqh", "Baima"], ["bqi", "Bakhtiari"], ["bqj", "Bandial"], ["bqk", "Banda-Mbrès"], ["bql", "Bilakura"], ["bqm", "Wumboko"], ["bqn", "Bulgarian Sign Language"], ["bqo", "Balo"], ["bqp", "Busa"], ["bqq", "Biritai"], ["bqr", "Burusu"], ["bqs", "Bosngun"], ["bqt", "Bamukumbit"], ["bqu", "Boguru"], ["bqv", "Koro Wachi, Begbere-Ejar"], ["bqw", "Buru (Nigeria)"], ["bqx", "Baangi"], ["bqy", "Bengkala Sign Language"], ["bqz", "Bakaka"], ["bra", "Braj"], ["brb", "Lave"], ["brc", "Berbice Creole Dutch"], ["brd", "Baraamu"], ["brf", "Bira"], ["brg", "Baure"], ["brh", "Brahui"], ["bri", "Mokpwe"], ["brj", "Bieria"], ["brk", "Birked"], ["brl", "Birwa"], ["brm", "Barambu"], ["brn", "Boruca"], ["bro", "Brokkat"], ["brp", "Barapasi"], ["brq", "Breri"], ["brr", "Birao"], ["brs", "Baras"], ["brt", "Bitare"], ["bru", "Eastern Bru"], ["brv", "Western Bru"], ["brw", "Bellari"], ["brx", "Bodo (India)"], ["bry", "Burui"], ["brz", "Bilbil"], ["bsa", "Abinomn"], ["bsb", "Brunei Bisaya"], ["bsc", "Bassari, Oniyan"], ["bse", "Wushi"], ["bsf", "Bauchi"], ["bsg", "Bashkardi"], ["bsh", "Kati"], ["bsi", "Bassossi"], ["bsj", "Bangwinji"], ["bsk", "Burushaski"], ["bsl", "Basa-Gumna"], ["bsm", "Busami"], ["bsn", "Barasana-Eduria"], ["bso", "Buso"], ["bsp", "Baga Sitemu"], ["bsq", "Bassa"], ["bsr", "Bassa-Kontagora"], ["bss", "Akoose"], ["bst", "Basketo"], ["bsu", "Bahonsuai"], ["bsv", "Baga Sobané"], ["bsw", "Baiso"], ["bsx", "Yangkam"], ["bsy", "Sabah Bisaya"], ["bta", "Bata"], ["btb", "Beti (Cameroon)"], ["btc", "Bati (Cameroon)"], ["btd", "Batak Dairi"], ["bte", "Gamo-Ningi"], ["btf", "Birgit"], ["btg", "Gagnoa Bété"], ["bth", "Biatah Bidayuh"], ["bti", "Burate"], ["btj", "Bacanese Malay"], ["btk", "Batak languages"], ["btl", "Bhatola"], ["btm", "Batak Mandailing"], ["btn", "Ratagnon"], ["bto", "Rinconada Bikol"], ["btp", "Budibud"], ["btq", "Batek"], ["btr", "Baetora"], ["bts", "Batak Simalungun"], ["btt", "Bete-Bendi"], ["btu", "Batu"], ["btv", "Bateri"], ["btw", "Butuanon"], ["btx", "Batak Karo"], ["bty", "Bobot"], ["btz", "Batak Alas-Kluet"], ["bua", "Buriat"], ["bub", "Bua"], ["buc", "Bushi"], ["bud", "Ntcham"], ["bue", "Beothuk"], ["buf", "Bushoong"], ["bug", "Buginese"], ["buh", "Younuo Bunu"], ["bui", "Bongili"], ["buj", "Basa-Gurmana"], ["buk", "Bugawac"], ["bum", "Bulu (Cameroon)"], ["bun", "Sherbro"], ["buo", "Terei"], ["bup", "Busoa"], ["buq", "Brem"], ["bus", "Bokobaru"], ["but", "Bungain"], ["buu", "Budu"], ["buv", "Bun"], ["buw", "Bubi"], ["bux", "Boghom"], ["buy", "Bullom So"], ["buz", "Bukwen"], ["bva", "Barein"], ["bvb", "Bube"], ["bvc", "Baelelea"], ["bvd", "Baeggu"], ["bve", "Berau Malay"], ["bvf", "Boor"], ["bvg", "Bonkeng"], ["bvh", "Bure"], ["bvi", "Belanda Viri"], ["bvj", "Baan"], ["bvk", "Bukat"], ["bvl", "Bolivian Sign Language"], ["bvm", "Bamunka"], ["bvn", "Buna"], ["bvo", "Bolgo"], ["bvp", "Bumang"], ["bvq", "Birri"], ["bvr", "Burarra"], ["bvt", "Bati (Indonesia)"], ["bvu", "Bukit Malay"], ["bvv", "Baniva"], ["bvw", "Boga"], ["bvx", "Dibole"], ["bvy", "Baybayanon"], ["bvz", "Bauzi"], ["bwa", "Bwatoo"], ["bwb", "Namosi-Naitasiri-Serua"], ["bwc", "Bwile"], ["bwd", "Bwaidoka"], ["bwe", "Bwe Karen"], ["bwf", "Boselewa"], ["bwg", "Barwe"], ["bwh", "Bishuo"], ["bwi", "Baniwa"], ["bwj", "Láá Láá Bwamu"], ["bwk", "Bauwaki"], ["bwl", "Bwela"], ["bwm", "Biwat"], ["bwn", "Wunai Bunu"], ["bwo", "Boro (Ethiopia), Borna (Ethiopia)"], ["bwp", "Mandobo Bawah"], ["bwq", "Southern Bobo Madaré"], ["bwr", "Bura-Pabir"], ["bws", "Bomboma"], ["bwt", "Bafaw-Balong"], ["bwu", "Buli (Ghana)"], ["bww", "Bwa"], ["bwx", "Bu-Nao Bunu"], ["bwy", "Cwi Bwamu"], ["bwz", "Bwisi"], ["bxa", "Tairaha"], ["bxb", "Belanda Bor"], ["bxc", "Molengue"], ["bxd", "Pela"], ["bxe", "Birale"], ["bxf", "Bilur, Minigir"], ["bxg", "Bangala"], ["bxh", "Buhutu"], ["bxi", "Pirlatapa"], ["bxj", "Bayungu"], ["bxk", "Bukusu, Lubukusu"], ["bxl", "Jalkunan"], ["bxm", "Mongolia Buriat"], ["bxn", "Burduna"], ["bxo", "Barikanchi"], ["bxp", "Bebil"], ["bxq", "Beele"], ["bxr", "Russia Buriat"], ["bxs", "Busam"], ["bxu", "China Buriat"], ["bxv", "Berakou"], ["bxw", "Bankagooma"], ["bxx", "Borna (Democratic Republic of Congo)"], ["bxz", "Binahari"], ["bya", "Batak"], ["byb", "Bikya"], ["byc", "Ubaghara"], ["byd", "Benyadu'"], ["bye", "Pouye"], ["byf", "Bete"], ["byg", "Baygo"], ["byh", "Bhujel"], ["byi", "Buyu"], ["byj", "Bina (Nigeria)"], ["byk", "Biao"], ["byl", "Bayono"], ["bym", "Bidjara"], ["byn", "Bilin, Blin"], ["byo", "Biyo"], ["byp", "Bumaji"], ["byq", "Basay"], ["byr", "Baruya, Yipma"], ["bys", "Burak"], ["byt", "Berti"], ["byv", "Medumba"], ["byw", "Belhariya"], ["byx", "Qaqet"], ["byy", "Buya"], ["byz", "Banaro"], ["bza", "Bandi"], ["bzb", "Andio"], ["bzc", "Southern Betsimisaraka Malagasy"], ["bzd", "Bribri"], ["bze", "Jenaama Bozo"], ["bzf", "Boikin"], ["bzg", "Babuza"], ["bzh", "Mapos Buang"], ["bzi", "Bisu"], ["bzj", "Belize Kriol English"], ["bzk", "Nicaragua Creole English"], ["bzl", "Boano (Sulawesi)"], ["bzm", "Bolondo"], ["bzn", "Boano (Maluku)"], ["bzo", "Bozaba"], ["bzp", "Kemberano"], ["bzq", "Buli (Indonesia)"], ["bzr", "Biri"], ["bzs", "Brazilian Sign Language"], ["bzt", "Brithenig"], ["bzu", "Burmeso"], ["bzv", "Naami"], ["bzw", "Basa (Nigeria)"], ["bzx", "Kɛlɛngaxo Bozo"], ["bzy", "Obanliku"], ["bzz", "Evant"], ["caa", "Chortí"], ["cab", "Garifuna"], ["cac", "Chuj"], ["cad", "Caddo"], ["cae", "Lehar, Laalaa"], ["caf", "Southern Carrier"], ["cag", "Nivaclé"], ["cah", "Cahuarano"], ["cai", "Central American Indian languages"], ["caj", "Chané"], ["cak", "Kaqchikel, Cakchiquel"], ["cal", "Carolinian"], ["cam", "Cemuhî"], ["can", "Chambri"], ["cao", "Chácobo"], ["cap", "Chipaya"], ["caq", "Car Nicobarese"], ["car", "Galibi Carib"], ["cas", "Tsimané"], ["cau", "Caucasian languages"], ["cav", "Cavineña"], ["caw", "Callawalla"], ["cax", "Chiquitano"], ["cay", "Cayuga"], ["caz", "Canichana"], ["cba", "Chibchan languages"], ["cbb", "Cabiyarí"], ["cbc", "Carapana"], ["cbd", "Carijona"], ["cbe", "Chipiajes"], ["cbg", "Chimila"], ["cbh", "Cagua"], ["cbi", "Chachi"], ["cbj", "Ede Cabe"], ["cbk", "Chavacano"], ["cbl", "Bualkhaw Chin"], ["cbn", "Nyahkur"], ["cbo", "Izora"], ["cbq", "Tsucuba, Cuba"], ["cbr", "Cashibo-Cacataibo"], ["cbs", "Cashinahua"], ["cbt", "Chayahuita"], ["cbu", "Candoshi-Shapra"], ["cbv", "Cacua"], ["cbw", "Kinabalian"], ["cby", "Carabayo"], ["cca", "Cauca"], ["ccc", "Chamicuro"], ["ccd", "Cafundo Creole"], ["cce", "Chopi"], ["ccg", "Samba Daka"], ["cch", "Atsam"], ["ccj", "Kasanga"], ["ccl", "Cutchi-Swahili"], ["ccm", "Malaccan Creole Malay"], ["ccn", "North Caucasian languages"], ["cco", "Comaltepec Chinantec"], ["ccp", "Chakma"], ["ccq", "Chaungtha"], ["ccr", "Cacaopera"], ["ccs", "South Caucasian languages"], ["cda", "Choni"], ["cdc", "Chadic languages"], ["cdd", "Caddoan languages"], ["cde", "Chenchu"], ["cdf", "Chiru"], ["cdg", "Chamari"], ["cdh", "Chambeali"], ["cdi", "Chodri"], ["cdj", "Churahi"], ["cdm", "Chepang"], ["cdn", "Chaudangsi"], ["cdo", "Min Dong Chinese"], ["cdr", "Cinda-Regi-Tiyal"], ["cds", "Chadian Sign Language"], ["cdy", "Chadong"], ["cdz", "Koda"], ["cea", "Lower Chehalis"], ["ceb", "Cebuano"], ["ceg", "Chamacoco"], ["cek", "Eastern Khumi Chin"], ["cel", "Celtic languages"], ["cen", "Cen"], ["cet", "Centúúm"], ["cey", "Ekai Chin"], ["cfa", "Dijim-Bwilim"], ["cfd", "Cara"], ["cfg", "Como Karim"], ["cfm", "Falam Chin"], ["cga", "Changriwa"], ["cgc", "Kagayanen"], ["cgg", "Chiga"], ["cgk", "Chocangacakha"], ["chb", "Chibcha"], ["chc", "Catawba"], ["chd", "Highland Oaxaca Chontal"], ["chf", "Tabasco Chontal"], ["chg", "Chagatai"], ["chh", "Chinook"], ["chj", "Ojitlán Chinantec"], ["chk", "Chuukese"], ["chl", "Cahuilla"], ["chm", "Mari (Russia)"], ["chn", "Chinook jargon"], ["cho", "Choctaw"], ["chp", "Chipewyan, Dene Suline"], ["chq", "Quiotepec Chinantec"], ["chr", "Cherokee"], ["cht", "Cholón"], ["chw", "Chuwabu"], ["chx", "Chantyal"], ["chy", "Cheyenne"], ["chz", "Ozumacín Chinantec"], ["cia", "Cia-Cia"], ["cib", "Ci Gbe"], ["cic", "Chickasaw"], ["cid", "Chimariko"], ["cie", "Cineni"], ["cih", "Chinali"], ["cik", "Chitkuli Kinnauri"], ["cim", "Cimbrian"], ["cin", "Cinta Larga"], ["cip", "Chiapanec"], ["cir", "Tiri, Haméa, Méa"], ["ciw", "Chippewa"], ["ciy", "Chaima"], ["cja", "Western Cham"], ["cje", "Chru"], ["cjh", "Upper Chehalis"], ["cji", "Chamalal"], ["cjk", "Chokwe"], ["cjm", "Eastern Cham"], ["cjn", "Chenapian"], ["cjo", "Ashéninka Pajonal"], ["cjp", "Cabécar"], ["cjr", "Chorotega"], ["cjs", "Shor"], ["cjv", "Chuave"], ["cjy", "Jinyu Chinese"], ["cka", "Khumi Awa Chin"], ["ckb", "Central Kurdish"], ["ckh", "Chak"], ["ckl", "Cibak"], ["ckm", "Chakavian"], ["ckn", "Kaang Chin"], ["cko", "Anufo"], ["ckq", "Kajakse"], ["ckr", "Kairak"], ["cks", "Tayo"], ["ckt", "Chukot"], ["cku", "Koasati"], ["ckv", "Kavalan"], ["ckx", "Caka"], ["cky", "Cakfem-Mushere"], ["ckz", "Cakchiquel-Quiché Mixed Language"], ["cla", "Ron"], ["clc", "Chilcotin"], ["cld", "Chaldean Neo-Aramaic"], ["cle", "Lealao Chinantec"], ["clh", "Chilisso"], ["cli", "Chakali"], ["clj", "Laitu Chin"], ["clk", "Idu-Mishmi"], ["cll", "Chala"], ["clm", "Clallam"], ["clo", "Lowland Oaxaca Chontal"], ["clt", "Lautu Chin"], ["clu", "Caluyanun"], ["clw", "Chulym"], ["cly", "Eastern Highland Chatino"], ["cma", "Maa"], ["cmc", "Chamic languages"], ["cme", "Cerma"], ["cmg", "Classical Mongolian"], ["cmi", "Emberá-Chamí"], ["cmk", "Chimakum"], ["cml", "Campalagian"], ["cmm", "Michigamea"], ["cmn", "Mandarin Chinese"], ["cmo", "Central Mnong"], ["cmr", "Mro-Khimi Chin"], ["cms", "Messapic"], ["cmt", "Camtho"], ["cna", "Changthang"], ["cnb", "Chinbon Chin"], ["cnc", "Côông"], ["cng", "Northern Qiang"], ["cnh", "Hakha Chin, Haka Chin"], ["cni", "Asháninka"], ["cnk", "Khumi Chin"], ["cnl", "Lalana Chinantec"], ["cno", "Con"], ["cnp", "Northern Ping Chinese, Northern Pinghua"], ["cnr", "Montenegrin"], ["cns", "Central Asmat"], ["cnt", "Tepetotutla Chinantec"], ["cnu", "Chenoua"], ["cnw", "Ngawn Chin"], ["cnx", "Middle Cornish"], ["coa", "Cocos Islands Malay"], ["cob", "Chicomuceltec"], ["coc", "Cocopa"], ["cod", "Cocama-Cocamilla"], ["coe", "Koreguaje"], ["cof", "Colorado"], ["cog", "Chong"], ["coh", "Chonyi-Dzihana-Kauma, Chichonyi-Chidzihana-Chikauma"], ["coj", "Cochimi"], ["cok", "Santa Teresa Cora"], ["col", "Columbia-Wenatchi"], ["com", "Comanche"], ["con", "Cofán"], ["coo", "Comox"], ["cop", "Coptic"], ["coq", "Coquille"], ["cot", "Caquinte"], ["cou", "Wamey"], ["cov", "Cao Miao"], ["cow", "Cowlitz"], ["cox", "Nanti"], ["coy", "Coyaima"], ["coz", "Chochotec"], ["cpa", "Palantla Chinantec"], ["cpb", "Ucayali-Yurúa Ashéninka"], ["cpc", "Ajyíninka Apurucayali"], ["cpe", "English-based creoles and pidgins"], ["cpf", "French-based creoles and pidgins"], ["cpg", "Cappadocian Greek"], ["cpi", "Chinese Pidgin English"], ["cpn", "Cherepon"], ["cpo", "Kpeego"], ["cpp", "Portuguese-based creoles and pidgins"], ["cps", "Capiznon"], ["cpu", "Pichis Ashéninka"], ["cpx", "Pu-Xian Chinese"], ["cpy", "South Ucayali Ashéninka"], ["cqd", "Chuanqiandian Cluster Miao"], ["cqu", "Chilean Quechua"], ["cra", "Chara"], ["crb", "Island Carib"], ["crc", "Lonwolwol"], ["crd", "Coeur d'Alene"], ["crf", "Caramanta"], ["crg", "Michif"], ["crh", "Crimean Tatar, Crimean Turkish"], ["cri", "Sãotomense"], ["crj", "Southern East Cree"], ["crk", "Plains Cree"], ["crl", "Northern East Cree"], ["crm", "Moose Cree"], ["crn", "El Nayar Cora"], ["cro", "Crow"], ["crp", "Creoles and pidgins"], ["crq", "Iyo'wujwa Chorote"], ["crr", "Carolina Algonquian"], ["crs", "Seselwa Creole French"], ["crt", "Iyojwa'ja Chorote"], ["crv", "Chaura"], ["crw", "Chrau"], ["crx", "Carrier"], ["cry", "Cori"], ["crz", "Cruzeño"], ["csa", "Chiltepec Chinantec"], ["csb", "Kashubian"], ["csc", "Catalan Sign Language, Lengua de señas catalana, Llengua de Signes Catalana"], ["csd", "Chiangmai Sign Language"], ["cse", "Czech Sign Language"], ["csf", "Cuba Sign Language"], ["csg", "Chilean Sign Language"], ["csh", "Asho Chin"], ["csi", "Coast Miwok"], ["csj", "Songlai Chin"], ["csk", "Jola-Kasa"], ["csl", "Chinese Sign Language"], ["csm", "Central Sierra Miwok"], ["csn", "Colombian Sign Language"], ["cso", "Sochiapam Chinantec, Sochiapan Chinantec"], ["csp", "Southern Ping Chinese, Southern Pinghua"], ["csq", "Croatia Sign Language"], ["csr", "Costa Rican Sign Language"], ["css", "Southern Ohlone"], ["cst", "Northern Ohlone"], ["csu", "Central Sudanic languages"], ["csv", "Sumtu Chin"], ["csw", "Swampy Cree"], ["csx", "Cambodian Sign Language"], ["csy", "Siyin Chin"], ["csz", "Coos"], ["cta", "Tataltepec Chatino"], ["ctc", "Chetco"], ["ctd", "Tedim Chin"], ["cte", "Tepinapa Chinantec"], ["ctg", "Chittagonian"], ["cth", "Thaiphum Chin"], ["ctl", "Tlacoatzintepec Chinantec"], ["ctm", "Chitimacha"], ["ctn", "Chhintange"], ["cto", "Emberá-Catío"], ["ctp", "Western Highland Chatino"], ["cts", "Northern Catanduanes Bikol"], ["ctt", "Wayanad Chetti"], ["ctu", "Chol"], ["cty", "Moundadan Chetty"], ["ctz", "Zacatepec Chatino"], ["cua", "Cua"], ["cub", "Cubeo"], ["cuc", "Usila Chinantec"], ["cug", "Chungmboko, Cung"], ["cuh", "Chuka, Gichuka"], ["cui", "Cuiba"], ["cuj", "Mashco Piro"], ["cuk", "San Blas Kuna"], ["cul", "Culina, Kulina"], ["cum", "Cumeral"], ["cuo", "Cumanagoto"], ["cup", "Cupeño"], ["cuq", "Cun"], ["cur", "Chhulung"], ["cus", "Cushitic languages"], ["cut", "Teutila Cuicatec"], ["cuu", "Tai Ya"], ["cuv", "Cuvok"], ["cuw", "Chukwa"], ["cux", "Tepeuxila Cuicatec"], ["cuy", "Cuitlatec"], ["cvg", "Chug"], ["cvn", "Valle Nacional Chinantec"], ["cwa", "Kabwa"], ["cwb", "Maindo"], ["cwd", "Woods Cree"], ["cwe", "Kwere"], ["cwg", "Chewong, Cheq Wong"], ["cwt", "Kuwaataay"], ["cya", "Nopala Chatino"], ["cyb", "Cayubaba"], ["cyo", "Cuyonon"], ["czh", "Huizhou Chinese"], ["czk", "Knaanic"], ["czn", "Zenzontepec Chatino"], ["czo", "Min Zhong Chinese"], ["czt", "Zotung Chin"], ["daa", "Dangaléat"], ["dac", "Dambi"], ["dad", "Marik"], ["dae", "Duupa"], ["daf", "Dan"], ["dag", "Dagbani"], ["dah", "Gwahatike"], ["dai", "Day"], ["daj", "Dar Fur Daju"], ["dak", "Dakota"], ["dal", "Dahalo"], ["dam", "Damakawa"], ["dao", "Daai Chin"], ["dap", "Nisi (India)"], ["daq", "Dandami Maria"], ["dar", "Dargwa"], ["das", "Daho-Doo"], ["dau", "Dar Sila Daju"], ["dav", "Taita, Dawida"], ["daw", "Davawenyo"], ["dax", "Dayi"], ["day", "Land Dayak languages"], ["daz", "Dao"], ["dba", "Bangime"], ["dbb", "Deno"], ["dbd", "Dadiya"], ["dbe", "Dabe"], ["dbf", "Edopi"], ["dbg", "Dogul Dom Dogon"], ["dbi", "Doka"], ["dbj", "Ida'an"], ["dbl", "Dyirbal"], ["dbm", "Duguri"], ["dbn", "Duriankere"], ["dbo", "Dulbu"], ["dbp", "Duwai"], ["dbq", "Daba"], ["dbr", "Dabarre"], ["dbt", "Ben Tey Dogon"], ["dbu", "Bondum Dom Dogon"], ["dbv", "Dungu"], ["dbw", "Bankan Tey Dogon"], ["dby", "Dibiyaso"], ["dcc", "Deccan"], ["dcr", "Negerhollands"], ["dda", "Dadi Dadi"], ["ddd", "Dongotono"], ["dde", "Doondo"], ["ddg", "Fataluku"], ["ddi", "West Goodenough"], ["ddj", "Jaru"], ["ddn", "Dendi (Benin)"], ["ddo", "Dido"], ["ddr", "Dhudhuroa"], ["dds", "Donno So Dogon"], ["ddw", "Dawera-Daweloor"], ["dec", "Dagik"], ["ded", "Dedua"], ["dee", "Dewoin"], ["def", "Dezfuli"], ["deg", "Degema"], ["deh", "Dehwari"], ["dei", "Demisa"], ["dek", "Dek"], ["del", "Delaware"], ["dem", "Dem"], ["den", "Slave (Athapascan)"], ["dep", "Pidgin Delaware"], ["deq", "Dendi (Central African Republic)"], ["der", "Deori"], ["des", "Desano"], ["dev", "Domung"], ["dez", "Dengese"], ["dga", "Southern Dagaare"], ["dgb", "Bunoge Dogon"], ["dgc", "Casiguran Dumagat Agta"], ["dgd", "Dagaari Dioula"], ["dge", "Degenan"], ["dgg", "Doga"], ["dgh", "Dghwede"], ["dgi", "Northern Dagara"], ["dgk", "Dagba"], ["dgl", "Andaandi, Dongolawi"], ["dgn", "Dagoman"], ["dgo", "Dogri (individual language)"], ["dgr", "Dogrib, Tłı̨chǫ"], ["dgs", "Dogoso"], ["dgt", "Ndra'ngith"], ["dgu", "Degaru"], ["dgw", "Daungwurrung"], ["dgx", "Doghoro"], ["dgz", "Daga"], ["dha", "Dhanwar (India)"], ["dhd", "Dhundari"], ["dhg", "Dhangu-Djangu, Dhangu, Djangu"], ["dhi", "Dhimal"], ["dhl", "Dhalandji"], ["dhm", "Zemba"], ["dhn", "Dhanki"], ["dho", "Dhodia"], ["dhr", "Dhargari"], ["dhs", "Dhaiso"], ["dhu", "Dhurga"], ["dhv", "Dehu, Drehu"], ["dhw", "Dhanwar (Nepal)"], ["dhx", "Dhungaloo"], ["dia", "Dia"], ["dib", "South Central Dinka"], ["dic", "Lakota Dida"], ["did", "Didinga"], ["dif", "Dieri, Diyari"], ["dig", "Digo, Chidigo"], ["dih", "Kumiai"], ["dii", "Dimbong"], ["dij", "Dai"], ["dik", "Southwestern Dinka"], ["dil", "Dilling"], ["dim", "Dime"], ["din", "Dinka"], ["dio", "Dibo"], ["dip", "Northeastern Dinka"], ["diq", "Dimli (individual language)"], ["dir", "Dirim"], ["dis", "Dimasa"], ["dit", "Dirari"], ["diu", "Diriku"], ["diw", "Northwestern Dinka"], ["dix", "Dixon Reef"], ["diy", "Diuwe"], ["diz", "Ding"], ["dja", "Djadjawurrung"], ["djb", "Djinba"], ["djc", "Dar Daju Daju"], ["djd", "Djamindjung, Ngaliwurru"], ["dje", "Zarma"], ["djf", "Djangun"], ["dji", "Djinang"], ["djj", "Djeebbana"], ["djk", "Eastern Maroon Creole, Businenge Tongo, Nenge"], ["djl", "Djiwarli"], ["djm", "Jamsay Dogon"], ["djn", "Jawoyn, Djauan"], ["djo", "Jangkang"], ["djr", "Djambarrpuyngu"], ["dju", "Kapriman"], ["djw", "Djawi"], ["dka", "Dakpakha"], ["dkg", "Kadung"], ["dkk", "Dakka"], ["dkl", "Kolum So Dogon"], ["dkr", "Kuijau"], ["dks", "Southeastern Dinka"], ["dkx", "Mazagway"], ["dlg", "Dolgan"], ["dlk", "Dahalik"], ["dlm", "Dalmatian"], ["dln", "Darlong"], ["dma", "Duma"], ["dmb", "Mombo Dogon"], ["dmc", "Gavak"], ["dmd", "Madhi Madhi"], ["dme", "Dugwor"], ["dmf", "Medefaidrin"], ["dmg", "Upper Kinabatangan"], ["dmk", "Domaaki"], ["dml", "Dameli"], ["dmm", "Dama"], ["dmn", "Mande languages"], ["dmo", "Kemedzung"], ["dmr", "East Damar"], ["dms", "Dampelas"], ["dmu", "Dubu, Tebi"], ["dmv", "Dumpas"], ["dmw", "Mudburra"], ["dmx", "Dema"], ["dmy", "Demta, Sowari"], ["dna", "Upper Grand Valley Dani"], ["dnd", "Daonda"], ["dne", "Ndendeule"], ["dng", "Dungan"], ["dni", "Lower Grand Valley Dani"], ["dnj", "Dan"], ["dnk", "Dengka"], ["dnn", "Dzùùngoo"], ["dno", "Ndrulo, Northern Lendu"], ["dnr", "Danaru"], ["dnt", "Mid Grand Valley Dani"], ["dnu", "Danau"], ["dnv", "Danu"], ["dnw", "Western Dani"], ["dny", "Dení"], ["doa", "Dom"], ["dob", "Dobu"], ["doc", "Northern Dong"], ["doe", "Doe"], ["dof", "Domu"], ["doh", "Dong"], ["doi", "Dogri (macrolanguage)"], ["dok", "Dondo"], ["dol", "Doso"], ["don", "Toura (Papua New Guinea)"], ["doo", "Dongo"], ["dop", "Lukpa"], ["doq", "Dominican Sign Language"], ["dor", "Dori'o"], ["dos", "Dogosé"], ["dot", "Dass"], ["dov", "Dombe"], ["dow", "Doyayo"], ["dox", "Bussa"], ["doy", "Dompo"], ["doz", "Dorze"], ["dpp", "Papar"], ["dra", "Dravidian languages"], ["drb", "Dair"], ["drc", "Minderico"], ["drd", "Darmiya"], ["dre", "Dolpo"], ["drg", "Rungus"], ["drh", "Darkhat"], ["dri", "C'Lela"], ["drl", "Paakantyi"], ["drn", "West Damar"], ["dro", "Daro-Matu Melanau"], ["drq", "Dura"], ["drr", "Dororo"], ["drs", "Gedeo"], ["drt", "Drents"], ["dru", "Rukai"], ["drw", "Darwazi"], ["dry", "Darai"], ["dsb", "Lower Sorbian"], ["dse", "Dutch Sign Language"], ["dsh", "Daasanach"], ["dsi", "Disa"], ["dsl", "Danish Sign Language"], ["dsn", "Dusner"], ["dso", "Desiya"], ["dsq", "Tadaksahak"], ["dta", "Daur"], ["dtb", "Labuk-Kinabatangan Kadazan"], ["dtd", "Ditidaht"], ["dth", "Adithinngithigh"], ["dti", "Ana Tinga Dogon"], ["dtk", "Tene Kan Dogon"], ["dtm", "Tomo Kan Dogon"], ["dtn", "Daatsʼíin"], ["dto", "Tommo So Dogon"], ["dtp", "Kadazan Dusun, Central Dusun"], ["dtr", "Lotud"], ["dts", "Toro So Dogon"], ["dtt", "Toro Tegu Dogon"], ["dtu", "Tebul Ure Dogon"], ["dty", "Dotyali"], ["dua", "Duala"], ["dub", "Dubli"], ["duc", "Duna"], ["dud", "Hun-Saare"], ["due", "Umiray Dumaget Agta"], ["duf", "Dumbea, Drubea"], ["dug", "Duruma, Chiduruma"], ["duh", "Dungra Bhil"], ["dui", "Dumun"], ["duj", "Dhuwal"], ["duk", "Uyajitaya"], ["dul", "Alabat Island Agta"], ["dum", "Middle Dutch (ca. 1050-1350)"], ["dun", "Dusun Deyah"], ["duo", "Dupaninan Agta"], ["dup", "Duano"], ["duq", "Dusun Malang"], ["dur", "Dii"], ["dus", "Dumi"], ["duu", "Drung"], ["duv", "Duvle"], ["duw", "Dusun Witu"], ["dux", "Duungooma"], ["duy", "Dicamay Agta"], ["duz", "Duli-Gey"], ["dva", "Duau"], ["dwa", "Diri"], ["dwk", "Dawik Kui"], ["dwl", "Walo Kumbe Dogon"], ["dwr", "Dawro"], ["dws", "Dutton World Speedwords"], ["dwu", "Dhuwal"], ["dww", "Dawawa"], ["dwy", "Dhuwaya"], ["dwz", "Dewas Rai"], ["dya", "Dyan"], ["dyb", "Dyaberdyaber"], ["dyd", "Dyugun"], ["dyg", "Villa Viciosa Agta"], ["dyi", "Djimini Senoufo"], ["dym", "Yanda Dom Dogon"], ["dyn", "Dyangadi, Dhanggatti"], ["dyo", "Jola-Fonyi"], ["dyu", "Dyula"], ["dyy", "Djabugay, Dyaabugay"], ["dza", "Tunzu"], ["dzd", "Daza"], ["dze", "Djiwarli"], ["dzg", "Dazaga"], ["dzl", "Dzalakha"], ["dzn", "Dzando"], ["eaa", "Karenggapa"], ["ebc", "Beginci"], ["ebg", "Ebughu"], ["ebk", "Eastern Bontok"], ["ebo", "Teke-Ebo"], ["ebr", "Ebrié"], ["ebu", "Embu, Kiembu"], ["ecr", "Eteocretan"], ["ecs", "Ecuadorian Sign Language"], ["ecy", "Eteocypriot"], ["eee", "E"], ["efa", "Efai"], ["efe", "Efe"], ["efi", "Efik"], ["ega", "Ega"], ["egl", "Emilian"], ["ego", "Eggon"], ["egx", "Egyptian languages"], ["egy", "Egyptian (Ancient)"], ["ehs", "Miyakubo Sign Language"], ["ehu", "Ehueun"], ["eip", "Eipomek"], ["eit", "Eitiep"], ["eiv", "Askopan"], ["eja", "Ejamat"], ["eka", "Ekajuk"], ["ekc", "Eastern Karnic"], ["eke", "Ekit"], ["ekg", "Ekari"], ["eki", "Eki"], ["ekk", "Standard Estonian"], ["ekl", "Kol (Bangladesh), Kol"], ["ekm", "Elip"], ["eko", "Koti"], ["ekp", "Ekpeye"], ["ekr", "Yace"], ["eky", "Eastern Kayah"], ["ele", "Elepi"], ["elh", "El Hugeirat"], ["eli", "Nding"], ["elk", "Elkei"], ["elm", "Eleme"], ["elo", "El Molo"], ["elp", "Elpaputih"], ["elu", "Elu"], ["elx", "Elamite"], ["ema", "Emai-Iuleha-Ora"], ["emb", "Embaloh"], ["eme", "Emerillon"], ["emg", "Eastern Meohang"], ["emi", "Mussau-Emira"], ["emk", "Eastern Maninkakan"], ["emm", "Mamulique"], ["emn", "Eman"], ["emo", "Emok"], ["emp", "Northern Emberá"], ["emq", "Eastern Minyag"], ["ems", "Pacific Gulf Yupik"], ["emu", "Eastern Muria"], ["emw", "Emplawas"], ["emx", "Erromintxela"], ["emy", "Epigraphic Mayan"], ["emz", "Mbessa"], ["ena", "Apali"], ["enb", "Markweeta"], ["enc", "En"], ["end", "Ende"], ["enf", "Forest Enets"], ["enh", "Tundra Enets"], ["enl", "Enlhet"], ["enm", "Middle English (1100-1500)"], ["enn", "Engenni"], ["eno", "Enggano"], ["enq", "Enga"], ["enr", "Emumu, Emem"], ["enu", "Enu"], ["env", "Enwan (Edu State)"], ["enw", "Enwan (Akwa Ibom State)"], ["enx", "Enxet"], ["eot", "Beti (Côte d'Ivoire)"], ["epi", "Epie"], ["era", "Eravallan"], ["erg", "Sie"], ["erh", "Eruwa"], ["eri", "Ogea"], ["erk", "South Efate"], ["ero", "Horpa"], ["err", "Erre"], ["ers", "Ersu"], ["ert", "Eritai"], ["erw", "Erokwanas"], ["ese", "Ese Ejja"], ["esg", "Aheri Gondi"], ["esh", "Eshtehardi"], ["esi", "North Alaskan Inupiatun"], ["esk", "Northwest Alaska Inupiatun"], ["esl", "Egypt Sign Language"], ["esm", "Esuma"], ["esn", "Salvadoran Sign Language"], ["eso", "Estonian Sign Language"], ["esq", "Esselen"], ["ess", "Central Siberian Yupik"], ["esu", "Central Yupik"], ["esx", "Eskimo-Aleut languages"], ["esy", "Eskayan"], ["etb", "Etebi"], ["etc", "Etchemin"], ["eth", "Ethiopian Sign Language"], ["etn", "Eton (Vanuatu)"], ["eto", "Eton (Cameroon)"], ["etr", "Edolo"], ["ets", "Yekhee"], ["ett", "Etruscan"], ["etu", "Ejagham"], ["etx", "Eten"], ["etz", "Semimi"], ["euq", "Basque (family)"], ["eve", "Even"], ["evh", "Uvbie"], ["evn", "Evenki"], ["ewo", "Ewondo"], ["ext", "Extremaduran"], ["eya", "Eyak"], ["eyo", "Keiyo"], ["eza", "Ezaa"], ["eze", "Uzekwe"], ["faa", "Fasu"], ["fab", "Fa d'Ambu"], ["fad", "Wagi"], ["faf", "Fagani"], ["fag", "Finongan"], ["fah", "Baissa Fali"], ["fai", "Faiwol"], ["faj", "Faita"], ["fak", "Fang (Cameroon)"], ["fal", "South Fali"], ["fam", "Fam"], ["fan", "Fang (Equatorial Guinea)"], ["fap", "Paloor"], ["far", "Fataleka"], ["fat", "Fanti"], ["fau", "Fayu"], ["fax", "Fala"], ["fay", "Southwestern Fars"], ["faz", "Northwestern Fars"], ["fbl", "West Albay Bikol"], ["fcs", "Quebec Sign Language"], ["fer", "Feroge"], ["ffi", "Foia Foia"], ["ffm", "Maasina Fulfulde"], ["fgr", "Fongoro"], ["fia", "Nobiin"], ["fie", "Fyer"], ["fif", "Faifi"], ["fil", "Filipino, Pilipino"], ["fip", "Fipa"], ["fir", "Firan"], ["fit", "Tornedalen Finnish"], ["fiu", "Finno-Ugrian languages"], ["fiw", "Fiwaga"], ["fkk", "Kirya-Konzəl"], ["fkv", "Kven Finnish"], ["fla", "Kalispel-Pend d'Oreille"], ["flh", "Foau"], ["fli", "Fali"], ["fll", "North Fali"], ["fln", "Flinders Island"], ["flr", "Fuliiru"], ["fly", "Flaaitaal, Tsotsitaal"], ["fmp", "Fe'fe'"], ["fmu", "Far Western Muria"], ["fnb", "Fanbak"], ["fng", "Fanagalo"], ["fni", "Fania"], ["fod", "Foodo"], ["foi", "Foi"], ["fom", "Foma"], ["fon", "Fon"], ["for", "Fore"], ["fos", "Siraya"], ["fox", "Formosan languages"], ["fpe", "Fernando Po Creole English"], ["fqs", "Fas"], ["frc", "Cajun French"], ["frd", "Fordata"], ["frk", "Frankish"], ["frm", "Middle French (ca. 1400-1600)"], ["fro", "Old French (842-ca. 1400)"], ["frp", "Arpitan, Francoprovençal"], ["frq", "Forak"], ["frr", "Northern Frisian"], ["frs", "Eastern Frisian"], ["frt", "Fortsenal"], ["fse", "Finnish Sign Language"], ["fsl", "French Sign Language"], ["fss", "Finland-Swedish Sign Language, finlandssvenskt teckenspråk, suomenruotsalainen viittomakieli"], ["fub", "Adamawa Fulfulde"], ["fuc", "Pulaar"], ["fud", "East Futuna"], ["fue", "Borgu Fulfulde"], ["fuf", "Pular"], ["fuh", "Western Niger Fulfulde"], ["fui", "Bagirmi Fulfulde"], ["fuj", "Ko"], ["fum", "Fum"], ["fun", "Fulniô"], ["fuq", "Central-Eastern Niger Fulfulde"], ["fur", "Friulian"], ["fut", "Futuna-Aniwa"], ["fuu", "Furu"], ["fuv", "Nigerian Fulfulde"], ["fuy", "Fuyug"], ["fvr", "Fur"], ["fwa", "Fwâi"], ["fwe", "Fwe"], ["gaa", "Ga"], ["gab", "Gabri"], ["gac", "Mixed Great Andamanese"], ["gad", "Gaddang"], ["gae", "Guarequena"], ["gaf", "Gende"], ["gag", "Gagauz"], ["gah", "Alekano"], ["gai", "Borei"], ["gaj", "Gadsup"], ["gak", "Gamkonora"], ["gal", "Galolen"], ["gam", "Kandawo"], ["gan", "Gan Chinese"], ["gao", "Gants"], ["gap", "Gal"], ["gaq", "Gata'"], ["gar", "Galeya"], ["gas", "Adiwasi Garasia"], ["gat", "Kenati"], ["gau", "Mudhili Gadaba"], ["gav", "Gabutamon"], ["gaw", "Nobonob"], ["gax", "Borana-Arsi-Guji Oromo"], ["gay", "Gayo"], ["gaz", "West Central Oromo"], ["gba", "Gbaya (Central African Republic)"], ["gbb", "Kaytetye"], ["gbc", "Garawa"], ["gbd", "Karajarri"], ["gbe", "Niksek"], ["gbf", "Gaikundi"], ["gbg", "Gbanziri"], ["gbh", "Defi Gbe"], ["gbi", "Galela"], ["gbj", "Bodo Gadaba"], ["gbk", "Gaddi"], ["gbl", "Gamit"], ["gbm", "Garhwali"], ["gbn", "Mo'da"], ["gbo", "Northern Grebo"], ["gbp", "Gbaya-Bossangoa"], ["gbq", "Gbaya-Bozoum"], ["gbr", "Gbagyi"], ["gbs", "Gbesi Gbe"], ["gbu", "Gagadu"], ["gbv", "Gbanu"], ["gbw", "Gabi-Gabi"], ["gbx", "Eastern Xwla Gbe"], ["gby", "Gbari"], ["gbz", "Zoroastrian Dari"], ["gcc", "Mali"], ["gcd", "Ganggalida"], ["gce", "Galice"], ["gcf", "Guadeloupean Creole French"], ["gcl", "Grenadian Creole English"], ["gcn", "Gaina"], ["gcr", "Guianese Creole French"], ["gct", "Colonia Tovar German"], ["gda", "Gade Lohar"], ["gdb", "Pottangi Ollar Gadaba"], ["gdc", "Gugu Badhun"], ["gdd", "Gedaged"], ["gde", "Gude"], ["gdf", "Guduf-Gava"], ["gdg", "Ga'dang"], ["gdh", "Gadjerawang, Gajirrabeng"], ["gdi", "Gundi"], ["gdj", "Gurdjar"], ["gdk", "Gadang"], ["gdl", "Dirasha"], ["gdm", "Laal"], ["gdn", "Umanakaina"], ["gdo", "Ghodoberi"], ["gdq", "Mehri"], ["gdr", "Wipi"], ["gds", "Ghandruk Sign Language"], ["gdt", "Kungardutyi"], ["gdu", "Gudu"], ["gdx", "Godwari"], ["gea", "Geruma"], ["geb", "Kire"], ["gec", "Gboloo Grebo"], ["ged", "Gade"], ["gef", "Gerai"], ["geg", "Gengle"], ["geh", "Hutterite German, Hutterisch"], ["gei", "Gebe"], ["gej", "Gen"], ["gek", "Ywom"], ["gel", "ut-Ma'in"], ["gem", "Germanic languages"], ["geq", "Geme"], ["ges", "Geser-Gorom"], ["gev", "Eviya"], ["gew", "Gera"], ["gex", "Garre"], ["gey", "Enya"], ["gez", "Geez"], ["gfk", "Patpatar"], ["gft", "Gafat"], ["gfx", "Mangetti Dune ǃXung"], ["gga", "Gao"], ["ggb", "Gbii"], ["ggd", "Gugadj"], ["gge", "Gurr-goni"], ["ggg", "Gurgula"], ["ggk", "Kungarakany"], ["ggl", "Ganglau"], ["ggn", "Eastern Gurung"], ["ggo", "Southern Gondi"], ["ggr", "Aghu Tharnggalu"], ["ggt", "Gitua"], ["ggu", "Gagu, Gban"], ["ggw", "Gogodala"], ["gha", "Ghadamès"], ["ghc", "Hiberno-Scottish Gaelic"], ["ghe", "Southern Ghale"], ["ghh", "Northern Ghale"], ["ghk", "Geko Karen"], ["ghl", "Ghulfan"], ["ghn", "Ghanongga"], ["gho", "Ghomara"], ["ghr", "Ghera"], ["ghs", "Guhu-Samane"], ["ght", "Kuke, Kutang Ghale"], ["gia", "Kija"], ["gib", "Gibanawa"], ["gic", "Gail"], ["gid", "Gidar"], ["gie", "Gaɓogbo, Guébie"], ["gig", "Goaria"], ["gih", "Githabul"], ["gii", "Girirra"], ["gil", "Gilbertese"], ["gim", "Gimi (Eastern Highlands)"], ["gin", "Hinukh"], ["gio", "Gelao"], ["gip", "Gimi (West New Britain)"], ["giq", "Green Gelao"], ["gir", "Red Gelao"], ["gis", "North Giziga"], ["git", "Gitxsan"], ["giu", "Mulao"], ["giw", "White Gelao"], ["gix", "Gilima"], ["giy", "Giyug"], ["giz", "South Giziga"], ["gji", "Geji"], ["gjk", "Kachi Koli"], ["gjm", "Gunditjmara"], ["gjn", "Gonja"], ["gjr", "Gurindji Kriol"], ["gju", "Gujari"], ["gka", "Guya"], ["gkd", "Magɨ (Madang Province)"], ["gke", "Ndai"], ["gkn", "Gokana"], ["gko", "Kok-Nar"], ["gkp", "Guinea Kpelle"], ["gku", "ǂUngkue"], ["glb", "Belning"], ["glc", "Bon Gula"], ["gld", "Nanai"], ["glh", "Northwest Pashai, Northwest Pashayi"], ["gli", "Guliguli"], ["glj", "Gula Iro"], ["glk", "Gilaki"], ["gll", "Garlali"], ["glo", "Galambu"], ["glr", "Glaro-Twabo"], ["glu", "Gula (Chad)"], ["glw", "Glavda"], ["gly", "Gule"], ["gma", "Gambera"], ["gmb", "Gula'alaa"], ["gmd", "Mághdì"], ["gme", "East Germanic languages"], ["gmg", "Magɨyi"], ["gmh", "Middle High German (ca. 1050-1500)"], ["gml", "Middle Low German"], ["gmm", "Gbaya-Mbodomo"], ["gmn", "Gimnime"], ["gmq", "North Germanic languages"], ["gmr", "Mirning, Mirniny"], ["gmu", "Gumalu"], ["gmv", "Gamo"], ["gmw", "West Germanic languages"], ["gmx", "Magoma"], ["gmy", "Mycenaean Greek"], ["gmz", "Mgbolizhia"], ["gna", "Kaansa"], ["gnb", "Gangte"], ["gnc", "Guanche"], ["gnd", "Zulgo-Gemzek"], ["gne", "Ganang"], ["gng", "Ngangam"], ["gnh", "Lere"], ["gni", "Gooniyandi"], ["gnj", "Ngen"], ["gnk", "ǁGana"], ["gnl", "Gangulu"], ["gnm", "Ginuman"], ["gnn", "Gumatj"], ["gno", "Northern Gondi"], ["gnq", "Gana"], ["gnr", "Gureng Gureng"], ["gnt", "Guntai"], ["gnu", "Gnau"], ["gnw", "Western Bolivian Guaraní"], ["gnz", "Ganzi"], ["goa", "Guro"], ["gob", "Playero"], ["goc", "Gorakor"], ["god", "Godié"], ["goe", "Gongduk"], ["gof", "Gofa"], ["gog", "Gogo"], ["goh", "Old High German (ca. 750-1050)"], ["goi", "Gobasi"], ["goj", "Gowlan"], ["gok", "Gowli"], ["gol", "Gola"], ["gom", "Goan Konkani"], ["gon", "Gondi"], ["goo", "Gone Dau"], ["gop", "Yeretuar"], ["goq", "Gorap"], ["gor", "Gorontalo"], ["gos", "Gronings"], ["got", "Gothic"], ["gou", "Gavar"], ["gow", "Gorowa"], ["gox", "Gobu"], ["goy", "Goundo"], ["goz", "Gozarkhani"], ["gpa", "Gupa-Abawa"], ["gpe", "Ghanaian Pidgin English"], ["gpn", "Taiap"], ["gqa", "Ga'anda"], ["gqi", "Guiqiong"], ["gqn", "Guana (Brazil)"], ["gqr", "Gor"], ["gqu", "Qau"], ["gra", "Rajput Garasia"], ["grb", "Grebo"], ["grc", "Ancient Greek (to 1453)"], ["grd", "Guruntum-Mbaaru"], ["grg", "Madi"], ["grh", "Gbiri-Niragu"], ["gri", "Ghari"], ["grj", "Southern Grebo"], ["grk", "Greek languages"], ["grm", "Kota Marudu Talantang"], ["gro", "Groma"], ["grq", "Gorovu"], ["grr", "Taznatit"], ["grs", "Gresi"], ["grt", "Garo"], ["gru", "Kistane"], ["grv", "Central Grebo"], ["grw", "Gweda"], ["grx", "Guriaso"], ["gry", "Barclayville Grebo"], ["grz", "Guramalum"], ["gse", "Ghanaian Sign Language"], ["gsg", "German Sign Language"], ["gsl", "Gusilay"], ["gsm", "Guatemalan Sign Language"], ["gsn", "Nema, Gusan"], ["gso", "Southwest Gbaya"], ["gsp", "Wasembo"], ["gss", "Greek Sign Language"], ["gsw", "Swiss German, Alemannic, Alsatian"], ["gta", "Guató"], ["gti", "Gbati-ri"], ["gtu", "Aghu-Tharnggala"], ["gua", "Shiki"], ["gub", "Guajajára"], ["guc", "Wayuu"], ["gud", "Yocoboué Dida"], ["gue", "Gurindji"], ["guf", "Gupapuyngu"], ["gug", "Paraguayan Guaraní"], ["guh", "Guahibo"], ["gui", "Eastern Bolivian Guaraní"], ["guk", "Gumuz"], ["gul", "Sea Island Creole English"], ["gum", "Guambiano"], ["gun", "Mbyá Guaraní"], ["guo", "Guayabero"], ["gup", "Gunwinggu"], ["guq", "Aché"], ["gur", "Farefare"], ["gus", "Guinean Sign Language"], ["gut", "Maléku Jaíka"], ["guu", "Yanomamö"], ["guv", "Gey"], ["guw", "Gun"], ["gux", "Gourmanchéma"], ["guz", "Gusii, Ekegusii"], ["gva", "Guana (Paraguay)"], ["gvc", "Guanano"], ["gve", "Duwet"], ["gvf", "Golin"], ["gvj", "Guajá"], ["gvl", "Gulay"], ["gvm", "Gurmana"], ["gvn", "Kuku-Yalanji"], ["gvo", "Gavião Do Jiparaná"], ["gvp", "Pará Gavião"], ["gvr", "Gurung"], ["gvs", "Gumawana"], ["gvy", "Guyani"], ["gwa", "Mbato"], ["gwb", "Gwa"], ["gwc", "Gawri, Kalami"], ["gwd", "Gawwada"], ["gwe", "Gweno"], ["gwf", "Gowro"], ["gwg", "Moo"], ["gwi", "Gwichʼin"], ["gwj", "ǀGwi"], ["gwm", "Awngthim"], ["gwn", "Gwandara"], ["gwr", "Gwere"], ["gwt", "Gawar-Bati"], ["gwu", "Guwamu"], ["gww", "Kwini"], ["gwx", "Gua"], ["gxx", "Wè Southern"], ["gya", "Northwest Gbaya"], ["gyb", "Garus"], ["gyd", "Kayardild"], ["gye", "Gyem"], ["gyf", "Gungabula"], ["gyg", "Gbayi"], ["gyi", "Gyele"], ["gyl", "Gayil"], ["gym", "Ngäbere"], ["gyn", "Guyanese Creole English"], ["gyo", "Gyalsumdo"], ["gyr", "Guarayu"], ["gyy", "Gunya"], ["gyz", "Geji, Gyaazi"], ["gza", "Ganza"], ["gzi", "Gazi"], ["gzn", "Gane"], ["haa", "Han"], ["hab", "Hanoi Sign Language"], ["hac", "Gurani"], ["had", "Hatam"], ["hae", "Eastern Oromo"], ["haf", "Haiphong Sign Language"], ["hag", "Hanga"], ["hah", "Hahon"], ["hai", "Haida"], ["haj", "Hajong"], ["hak", "Hakka Chinese"], ["hal", "Halang"], ["ham", "Hewa"], ["han", "Hangaza"], ["hao", "Hakö"], ["hap", "Hupla"], ["haq", "Ha"], ["har", "Harari"], ["has", "Haisla"], ["hav", "Havu"], ["haw", "Hawaiian"], ["hax", "Southern Haida"], ["hay", "Haya"], ["haz", "Hazaragi"], ["hba", "Hamba"], ["hbb", "Huba"], ["hbn", "Heiban"], ["hbo", "Ancient Hebrew"], ["hbu", "Habu"], ["hca", "Andaman Creole Hindi"], ["hch", "Huichol"], ["hdn", "Northern Haida"], ["hds", "Honduras Sign Language"], ["hdy", "Hadiyya"], ["hea", "Northern Qiandong Miao"], ["hed", "Herdé"], ["heg", "Helong"], ["heh", "Hehe"], ["hei", "Heiltsuk"], ["hem", "Hemba"], ["hgm", "Haiǁom"], ["hgw", "Haigwai"], ["hhi", "Hoia Hoia"], ["hhr", "Kerak"], ["hhy", "Hoyahoya"], ["hia", "Lamang"], ["hib", "Hibito"], ["hid", "Hidatsa"], ["hif", "Fiji Hindi"], ["hig", "Kamwe"], ["hih", "Pamosu"], ["hii", "Hinduri"], ["hij", "Hijuk"], ["hik", "Seit-Kaitetu"], ["hil", "Hiligaynon"], ["him", "Himachali languages, Western Pahari languages"], ["hio", "Tsoa"], ["hir", "Himarimã"], ["hit", "Hittite"], ["hiw", "Hiw"], ["hix", "Hixkaryána"], ["hji", "Haji"], ["hka", "Kahe"], ["hke", "Hunde"], ["hkh", "Khah, Poguli"], ["hkk", "Hunjara-Kaina Ke"], ["hkn", "Mel-Khaonh"], ["hks", "Hong Kong Sign Language, Heung Kong Sau Yue"], ["hla", "Halia"], ["hlb", "Halbi"], ["hld", "Halang Doan"], ["hle", "Hlersu"], ["hlt", "Matu Chin"], ["hlu", "Hieroglyphic Luwian"], ["hma", "Southern Mashan Hmong, Southern Mashan Miao"], ["hmb", "Humburi Senni Songhay"], ["hmc", "Central Huishui Hmong, Central Huishui Miao"], ["hmd", "Large Flowery Miao, A-hmaos, Da-Hua Miao"], ["hme", "Eastern Huishui Hmong, Eastern Huishui Miao"], ["hmf", "Hmong Don"], ["hmg", "Southwestern Guiyang Hmong"], ["hmh", "Southwestern Huishui Hmong, Southwestern Huishui Miao"], ["hmi", "Northern Huishui Hmong, Northern Huishui Miao"], ["hmj", "Ge, Gejia"], ["hmk", "Maek"], ["hml", "Luopohe Hmong, Luopohe Miao"], ["hmm", "Central Mashan Hmong, Central Mashan Miao"], ["hmn", "Hmong, Mong"], ["hmp", "Northern Mashan Hmong, Northern Mashan Miao"], ["hmq", "Eastern Qiandong Miao"], ["hmr", "Hmar"], ["hms", "Southern Qiandong Miao"], ["hmt", "Hamtai"], ["hmu", "Hamap"], ["hmv", "Hmong Dô"], ["hmw", "Western Mashan Hmong, Western Mashan Miao"], ["hmx", "Hmong-Mien languages"], ["hmy", "Southern Guiyang Hmong, Southern Guiyang Miao"], ["hmz", "Hmong Shua, Sinicized Miao"], ["hna", "Mina (Cameroon)"], ["hnd", "Southern Hindko"], ["hne", "Chhattisgarhi"], ["hng", "Hungu"], ["hnh", "ǁAni"], ["hni", "Hani"], ["hnj", "Hmong Njua, Mong Leng, Mong Njua"], ["hnn", "Hanunoo"], ["hno", "Northern Hindko"], ["hns", "Caribbean Hindustani"], ["hnu", "Hung"], ["hoa", "Hoava"], ["hob", "Mari (Madang Province)"], ["hoc", "Ho"], ["hod", "Holma"], ["hoe", "Horom"], ["hoh", "Hobyót"], ["hoi", "Holikachuk"], ["hoj", "Hadothi, Haroti"], ["hok", "Hokan languages"], ["hol", "Holu"], ["hom", "Homa"], ["hoo", "Holoholo"], ["hop", "Hopi"], ["hor", "Horo"], ["hos", "Ho Chi Minh City Sign Language"], ["hot", "Hote, Malê"], ["hov", "Hovongan"], ["how", "Honi"], ["hoy", "Holiya"], ["hoz", "Hozo"], ["hpo", "Hpon"], ["hps", "Hawai'i Sign Language (HSL), Hawai'i Pidgin Sign Language"], ["hra", "Hrangkhol"], ["hrc", "Niwer Mil"], ["hre", "Hre"], ["hrk", "Haruku"], ["hrm", "Horned Miao"], ["hro", "Haroi"], ["hrp", "Nhirrpi"], ["hrr", "Horuru"], ["hrt", "Hértevin"], ["hru", "Hruso"], ["hrw", "Warwar Feni"], ["hrx", "Hunsrik"], ["hrz", "Harzani"], ["hsb", "Upper Sorbian"], ["hsh", "Hungarian Sign Language"], ["hsl", "Hausa Sign Language"], ["hsn", "Xiang Chinese"], ["hss", "Harsusi"], ["hti", "Hoti"], ["hto", "Minica Huitoto"], ["hts", "Hadza"], ["htu", "Hitu"], ["htx", "Middle Hittite"], ["hub", "Huambisa"], ["huc", "ǂHua, ǂʼAmkhoe"], ["hud", "Huaulu"], ["hue", "San Francisco Del Mar Huave"], ["huf", "Humene"], ["hug", "Huachipaeri"], ["huh", "Huilliche"], ["hui", "Huli"], ["huj", "Northern Guiyang Hmong, Northern Guiyang Miao"], ["huk", "Hulung"], ["hul", "Hula"], ["hum", "Hungana"], ["huo", "Hu"], ["hup", "Hupa"], ["huq", "Tsat"], ["hur", "Halkomelem"], ["hus", "Huastec"], ["hut", "Humla"], ["huu", "Murui Huitoto"], ["huv", "San Mateo Del Mar Huave"], ["huw", "Hukumina"], ["hux", "Nüpode Huitoto"], ["huy", "Hulaulá"], ["huz", "Hunzib"], ["hvc", "Haitian Vodoun Culture Language"], ["hve", "San Dionisio Del Mar Huave"], ["hvk", "Haveke"], ["hvn", "Sabu"], ["hvv", "Santa María Del Mar Huave"], ["hwa", "Wané"], ["hwc", "Hawai'i Creole English, Hawai'i Pidgin"], ["hwo", "Hwana"], ["hya", "Hya"], ["hyw", "Western Armenian"], ["hyx", "Armenian (family)"], ["iai", "Iaai"], ["ian", "Iatmul"], ["iap", "Iapama"], ["iar", "Purari"], ["iba", "Iban"], ["ibb", "Ibibio"], ["ibd", "Iwaidja"], ["ibe", "Akpes"], ["ibg", "Ibanag"], ["ibh", "Bih"], ["ibi", "Ibilo"], ["ibl", "Ibaloi"], ["ibm", "Agoi"], ["ibn", "Ibino"], ["ibr", "Ibuoro"], ["ibu", "Ibu"], ["iby", "Ibani"], ["ica", "Ede Ica"], ["ich", "Etkywan"], ["icl", "Icelandic Sign Language"], ["icr", "Islander Creole English"], ["ida", "Idakho-Isukha-Tiriki, Luidakho-Luisukha-Lutirichi"], ["idb", "Indo-Portuguese"], ["idc", "Idon, Ajiya"], ["idd", "Ede Idaca"], ["ide", "Idere"], ["idi", "Idi"], ["idr", "Indri"], ["ids", "Idesa"], ["idt", "Idaté"], ["idu", "Idoma"], ["ifa", "Amganad Ifugao"], ["ifb", "Batad Ifugao, Ayangan Ifugao"], ["ife", "Ifè"], ["iff", "Ifo"], ["ifk", "Tuwali Ifugao"], ["ifm", "Teke-Fuumu"], ["ifu", "Mayoyao Ifugao"], ["ify", "Keley-I Kallahan"], ["igb", "Ebira"], ["ige", "Igede"], ["igg", "Igana"], ["igl", "Igala"], ["igm", "Kanggape"], ["ign", "Ignaciano"], ["igo", "Isebe"], ["igs", "Interglossa"], ["igw", "Igwe"], ["ihb", "Iha Based Pidgin"], ["ihi", "Ihievbe"], ["ihp", "Iha"], ["ihw", "Bidhawal"], ["iin", "Thiin"], ["iir", "Indo-Iranian languages"], ["ijc", "Izon"], ["ije", "Biseni"], ["ijj", "Ede Ije"], ["ijn", "Kalabari"], ["ijo", "Ijo languages"], ["ijs", "Southeast Ijo"], ["ike", "Eastern Canadian Inuktitut"], ["iki", "Iko"], ["ikk", "Ika"], ["ikl", "Ikulu"], ["iko", "Olulumo-Ikom"], ["ikp", "Ikpeshi"], ["ikr", "Ikaranggal"], ["iks", "Inuit Sign Language"], ["ikt", "Inuinnaqtun, Western Canadian Inuktitut"], ["ikv", "Iku-Gora-Ankwa"], ["ikw", "Ikwere"], ["ikx", "Ik"], ["ikz", "Ikizu"], ["ila", "Ile Ape"], ["ilb", "Ila"], ["ilg", "Garig-Ilgar"], ["ili", "Ili Turki"], ["ilk", "Ilongot"], ["ill", "Iranun"], ["ilm", "Iranun (Malaysia)"], ["ilo", "Iloko"], ["ilp", "Iranun (Philippines)"], ["ils", "International Sign"], ["ilu", "Ili'uun"], ["ilv", "Ilue"], ["ilw", "Talur"], ["ima", "Mala Malasar"], ["ime", "Imeraguen"], ["imi", "Anamgura"], ["iml", "Miluk"], ["imn", "Imonda"], ["imo", "Imbongu"], ["imr", "Imroing"], ["ims", "Marsian"], ["imy", "Milyan"], ["inb", "Inga"], ["inc", "Indic languages"], ["ine", "Indo-European languages"], ["ing", "Degexit'an"], ["inh", "Ingush"], ["inj", "Jungle Inga"], ["inl", "Indonesian Sign Language"], ["inm", "Minaean"], ["inn", "Isinai"], ["ino", "Inoke-Yate"], ["inp", "Iñapari"], ["ins", "Indian Sign Language"], ["int", "Intha"], ["inz", "Ineseño"], ["ior", "Inor"], ["iou", "Tuma-Irumu"], ["iow", "Iowa-Oto"], ["ipi", "Ipili"], ["ipo", "Ipiko"], ["iqu", "Iquito"], ["iqw", "Ikwo"], ["ira", "Iranian languages"], ["ire", "Iresim"], ["irh", "Irarutu"], ["iri", "Rigwe, Irigwe"], ["irk", "Iraqw"], ["irn", "Irántxe"], ["iro", "Iroquoian languages"], ["irr", "Ir"], ["iru", "Irula"], ["irx", "Kamberau"], ["iry", "Iraya"], ["isa", "Isabi"], ["isc", "Isconahua"], ["isd", "Isnag"], ["ise", "Italian Sign Language"], ["isg", "Irish Sign Language"], ["ish", "Esan"], ["isi", "Nkem-Nkum"], ["isk", "Ishkashimi"], ["ism", "Masimasi"], ["isn", "Isanzu"], ["iso", "Isoko"], ["isr", "Israeli Sign Language"], ["ist", "Istriot"], ["isu", "Isu (Menchum Division)"], ["itb", "Binongan Itneg"], ["itc", "Italic languages"], ["itd", "Southern Tidung"], ["ite", "Itene"], ["iti", "Inlaod Itneg"], ["itk", "Judeo-Italian"], ["itl", "Itelmen"], ["itm", "Itu Mbon Uzo"], ["ito", "Itonama"], ["itr", "Iteri"], ["its", "Isekiri"], ["itt", "Maeng Itneg"], ["itv", "Itawit"], ["itw", "Ito"], ["itx", "Itik"], ["ity", "Moyadan Itneg"], ["itz", "Itzá"], ["ium", "Iu Mien"], ["ivb", "Ibatan"], ["ivv", "Ivatan"], ["iwk", "I-Wak"], ["iwm", "Iwam"], ["iwo", "Iwur"], ["iws", "Sepik Iwam"], ["ixc", "Ixcatec"], ["ixl", "Ixil"], ["iya", "Iyayu"], ["iyo", "Mesaka"], ["iyx", "Yaka (Congo)"], ["izh", "Ingrian"], ["izi", "Izi-Ezaa-Ikwo-Mgbo"], ["izr", "Izere"], ["izz", "Izii"], ["jaa", "Jamamadí"], ["jab", "Hyam"], ["jac", "Popti', Jakalteko"], ["jad", "Jahanka"], ["jae", "Yabem"], ["jaf", "Jara"], ["jah", "Jah Hut"], ["jaj", "Zazao"], ["jak", "Jakun"], ["jal", "Yalahatan"], ["jam", "Jamaican Creole English"], ["jan", "Jandai"], ["jao", "Yanyuwa"], ["jaq", "Yaqay"], ["jar", "Jarawa (Nigeria)"], ["jas", "New Caledonian Javanese"], ["jat", "Jakati"], ["jau", "Yaur"], ["jax", "Jambi Malay"], ["jay", "Yan-nhangu, Nhangu"], ["jaz", "Jawe"], ["jbe", "Judeo-Berber"], ["jbi", "Badjiri"], ["jbj", "Arandai"], ["jbk", "Barikewa"], ["jbm", "Bijim"], ["jbn", "Nafusi"], ["jbo", "Lojban"], ["jbr", "Jofotek-Bromnya"], ["jbt", "Jabutí"], ["jbu", "Jukun Takum"], ["jbw", "Yawijibaya"], ["jcs", "Jamaican Country Sign Language"], ["jct", "Krymchak"], ["jda", "Jad"], ["jdg", "Jadgali"], ["jdt", "Judeo-Tat"], ["jeb", "Jebero"], ["jee", "Jerung"], ["jeg", "Jeng"], ["jeh", "Jeh"], ["jei", "Yei"], ["jek", "Jeri Kuo"], ["jel", "Yelmek"], ["jen", "Dza"], ["jer", "Jere"], ["jet", "Manem"], ["jeu", "Jonkor Bourmataguil"], ["jgb", "Ngbee"], ["jge", "Judeo-Georgian"], ["jgk", "Gwak"], ["jgo", "Ngomba"], ["jhi", "Jehai"], ["jhs", "Jhankot Sign Language"], ["jia", "Jina"], ["jib", "Jibu"], ["jic", "Tol"], ["jid", "Bu (Kaduna State)"], ["jie", "Jilbe"], ["jig", "Jingulu, Djingili"], ["jih", "sTodsde, Shangzhai"], ["jii", "Jiiddu"], ["jil", "Jilim"], ["jim", "Jimi (Cameroon)"], ["jio", "Jiamao"], ["jiq", "Guanyinqiao, Lavrung"], ["jit", "Jita"], ["jiu", "Youle Jinuo"], ["jiv", "Shuar"], ["jiy", "Buyuan Jinuo"], ["jje", "Jejueo"], ["jjr", "Bankal"], ["jka", "Kaera"], ["jkm", "Mobwa Karen"], ["jko", "Kubo"], ["jkp", "Paku Karen"], ["jkr", "Koro (India)"], ["jks", "Amami Koniya Sign Language"], ["jku", "Labir"], ["jle", "Ngile"], ["jls", "Jamaican Sign Language"], ["jma", "Dima"], ["jmb", "Zumbun"], ["jmc", "Machame"], ["jmd", "Yamdena"], ["jmi", "Jimi (Nigeria)"], ["jml", "Jumli"], ["jmn", "Makuri Naga"], ["jmr", "Kamara"], ["jms", "Mashi (Nigeria)"], ["jmw", "Mouwase"], ["jmx", "Western Juxtlahuaca Mixtec"], ["jna", "Jangshung"], ["jnd", "Jandavra"], ["jng", "Yangman"], ["jni", "Janji"], ["jnj", "Yemsa"], ["jnl", "Rawat"], ["jns", "Jaunsari"], ["job", "Joba"], ["jod", "Wojenaka"], ["jog", "Jogi"], ["jor", "Jorá"], ["jos", "Jordanian Sign Language"], ["jow", "Jowulu"], ["jpa", "Jewish Palestinian Aramaic"], ["jpr", "Judeo-Persian"], ["jpx", "Japanese (family)"], ["jqr", "Jaqaru"], ["jra", "Jarai"], ["jrb", "Judeo-Arabic"], ["jrr", "Jiru"], ["jrt", "Jakattoe"], ["jru", "Japrería"], ["jsl", "Japanese Sign Language"], ["jua", "Júma"], ["jub", "Wannu"], ["juc", "Jurchen"], ["jud", "Worodougou"], ["juh", "Hõne"], ["jui", "Ngadjuri"], ["juk", "Wapan"], ["jul", "Jirel"], ["jum", "Jumjum"], ["jun", "Juang"], ["juo", "Jiba"], ["jup", "Hupdë"], ["jur", "Jurúna"], ["jus", "Jumla Sign Language"], ["jut", "Jutish"], ["juu", "Ju"], ["juw", "Wãpha"], ["juy", "Juray"], ["jvd", "Javindo"], ["jvn", "Caribbean Javanese"], ["jwi", "Jwira-Pepesa"], ["jya", "Jiarong"], ["jye", "Judeo-Yemeni Arabic"], ["jyy", "Jaya"], ["kaa", "Kara-Kalpak, Karakalpak"], ["kab", "Kabyle"], ["kac", "Kachin, Jingpho"], ["kad", "Adara"], ["kae", "Ketangalan"], ["kaf", "Katso"], ["kag", "Kajaman"], ["kah", "Kara (Central African Republic)"], ["kai", "Karekare"], ["kaj", "Jju"], ["kak", "Kalanguya, Kayapa Kallahan"], ["kam", "Kamba (Kenya)"], ["kao", "Xaasongaxango"], ["kap", "Bezhta"], ["kaq", "Capanahua"], ["kar", "Karen languages"], ["kav", "Katukína"], ["kaw", "Kawi"], ["kax", "Kao"], ["kay", "Kamayurá"], ["kba", "Kalarko"], ["kbb", "Kaxuiâna"], ["kbc", "Kadiwéu"], ["kbd", "Kabardian"], ["kbe", "Kanju"], ["kbf", "Kakauhua"], ["kbg", "Khamba"], ["kbh", "Camsá"], ["kbi", "Kaptiau"], ["kbj", "Kari"], ["kbk", "Grass Koiari"], ["kbl", "Kanembu"], ["kbm", "Iwal"], ["kbn", "Kare (Central African Republic)"], ["kbo", "Keliko"], ["kbp", "Kabiyè"], ["kbq", "Kamano"], ["kbr", "Kafa"], ["kbs", "Kande"], ["kbt", "Abadi"], ["kbu", "Kabutra"], ["kbv", "Dera (Indonesia)"], ["kbw", "Kaiep"], ["kbx", "Ap Ma"], ["kby", "Manga Kanuri"], ["kbz", "Duhwa"], ["kca", "Khanty"], ["kcb", "Kawacha"], ["kcc", "Lubila"], ["kcd", "Ngkâlmpw Kanum"], ["kce", "Kaivi"], ["kcf", "Ukaan"], ["kcg", "Tyap"], ["kch", "Vono"], ["kci", "Kamantan"], ["kcj", "Kobiana"], ["kck", "Kalanga"], ["kcl", "Kela (Papua New Guinea), Kala"], ["kcm", "Gula (Central African Republic)"], ["kcn", "Nubi"], ["kco", "Kinalakna"], ["kcp", "Kanga"], ["kcq", "Kamo"], ["kcr", "Katla"], ["kcs", "Koenoem"], ["kct", "Kaian"], ["kcu", "Kami (Tanzania)"], ["kcv", "Kete"], ["kcw", "Kabwari"], ["kcx", "Kachama-Ganjule"], ["kcy", "Korandje"], ["kcz", "Konongo"], ["kda", "Worimi"], ["kdc", "Kutu"], ["kdd", "Yankunytjatjara"], ["kde", "Makonde"], ["kdf", "Mamusi"], ["kdg", "Seba"], ["kdh", "Tem"], ["kdi", "Kumam"], ["kdj", "Karamojong"], ["kdk", "Numèè, Kwényi"], ["kdl", "Tsikimba"], ["kdm", "Kagoma"], ["kdn", "Kunda"], ["kdo", "Kordofanian languages"], ["kdp", "Kaningdon-Nindem"], ["kdq", "Koch"], ["kdr", "Karaim"], ["kdt", "Kuy"], ["kdu", "Kadaru"], ["kdv", "Kado"], ["kdw", "Koneraw"], ["kdx", "Kam"], ["kdy", "Keder, Keijar"], ["kdz", "Kwaja"], ["kea", "Kabuverdianu"], ["keb", "Kélé"], ["kec", "Keiga"], ["ked", "Kerewe"], ["kee", "Eastern Keres"], ["kef", "Kpessi"], ["keg", "Tese"], ["keh", "Keak"], ["kei", "Kei"], ["kej", "Kadar"], ["kek", "Kekchí"], ["kel", "Kela (Democratic Republic of Congo)"], ["kem", "Kemak"], ["ken", "Kenyang"], ["keo", "Kakwa"], ["kep", "Kaikadi"], ["keq", "Kamar"], ["ker", "Kera"], ["kes", "Kugbo"], ["ket", "Ket"], ["keu", "Akebu"], ["kev", "Kanikkaran"], ["kew", "West Kewa"], ["kex", "Kukna"], ["key", "Kupia"], ["kez", "Kukele"], ["kfa", "Kodava"], ["kfb", "Northwestern Kolami"], ["kfc", "Konda-Dora"], ["kfd", "Korra Koraga"], ["kfe", "Kota (India)"], ["kff", "Koya"], ["kfg", "Kudiya"], ["kfh", "Kurichiya"], ["kfi", "Kannada Kurumba"], ["kfj", "Kemiehua"], ["kfk", "Kinnauri"], ["kfl", "Kung"], ["kfm", "Khunsari"], ["kfn", "Kuk"], ["kfo", "Koro (Côte d'Ivoire)"], ["kfp", "Korwa"], ["kfq", "Korku"], ["kfr", "Kachhi, Kutchi"], ["kfs", "Bilaspuri"], ["kft", "Kanjari"], ["kfu", "Katkari"], ["kfv", "Kurmukar"], ["kfw", "Kharam Naga"], ["kfx", "Kullu Pahari"], ["kfy", "Kumaoni"], ["kfz", "Koromfé"], ["kga", "Koyaga"], ["kgb", "Kawe"], ["kgc", "Kasseng"], ["kgd", "Kataang"], ["kge", "Komering"], ["kgf", "Kube"], ["kgg", "Kusunda"], ["kgh", "Upper Tanudan Kalinga"], ["kgi", "Selangor Sign Language"], ["kgj", "Gamale Kham"], ["kgk", "Kaiwá"], ["kgl", "Kunggari"], ["kgm", "Karipúna"], ["kgn", "Karingani"], ["kgo", "Krongo"], ["kgp", "Kaingang"], ["kgq", "Kamoro"], ["kgr", "Abun"], ["kgs", "Kumbainggar"], ["kgt", "Somyev"], ["kgu", "Kobol"], ["kgv", "Karas"], ["kgw", "Karon Dori"], ["kgx", "Kamaru"], ["kgy", "Kyerung"], ["kha", "Khasi"], ["khb", "Lü"], ["khc", "Tukang Besi North"], ["khd", "Bädi Kanum"], ["khe", "Korowai"], ["khf", "Khuen"], ["khg", "Khams Tibetan"], ["khh", "Kehu"], ["khi", "Khoisan languages"], ["khj", "Kuturmi"], ["khk", "Halh Mongolian"], ["khl", "Lusi"], ["khn", "Khandesi"], ["kho", "Khotanese, Sakan"], ["khp", "Kapori, Kapauri"], ["khq", "Koyra Chiini Songhay"], ["khr", "Kharia"], ["khs", "Kasua"], ["kht", "Khamti"], ["khu", "Nkhumbi"], ["khv", "Khvarshi"], ["khw", "Khowar"], ["khx", "Kanu"], ["khy", "Kele (Democratic Republic of Congo)"], ["khz", "Keapara"], ["kia", "Kim"], ["kib", "Koalib"], ["kic", "Kickapoo"], ["kid", "Koshin"], ["kie", "Kibet"], ["kif", "Eastern Parbate Kham"], ["kig", "Kimaama, Kimaghima"], ["kih", "Kilmeri"], ["kii", "Kitsai"], ["kij", "Kilivila"], ["kil", "Kariya"], ["kim", "Karagas"], ["kio", "Kiowa"], ["kip", "Sheshi Kham"], ["kiq", "Kosadle, Kosare"], ["kis", "Kis"], ["kit", "Agob"], ["kiu", "Kirmanjki (individual language)"], ["kiv", "Kimbu"], ["kiw", "Northeast Kiwai"], ["kix", "Khiamniungan Naga"], ["kiy", "Kirikiri"], ["kiz", "Kisi"], ["kja", "Mlap"], ["kjb", "Q'anjob'al, Kanjobal"], ["kjc", "Coastal Konjo"], ["kjd", "Southern Kiwai"], ["kje", "Kisar"], ["kjf", "Khalaj [Indo-Iranian]"], ["kjg", "Khmu"], ["kjh", "Khakas"], ["kji", "Zabana"], ["kjj", "Khinalugh"], ["kjk", "Highland Konjo"], ["kjl", "Western Parbate Kham"], ["kjm", "Kháng"], ["kjn", "Kunjen"], ["kjo", "Harijan Kinnauri"], ["kjp", "Pwo Eastern Karen"], ["kjq", "Western Keres"], ["kjr", "Kurudu"], ["kjs", "East Kewa"], ["kjt", "Phrae Pwo Karen"], ["kju", "Kashaya"], ["kjv", "Kaikavian Literary Language"], ["kjx", "Ramopa"], ["kjy", "Erave"], ["kjz", "Bumthangkha"], ["kka", "Kakanda"], ["kkb", "Kwerisa"], ["kkc", "Odoodee"], ["kkd", "Kinuku"], ["kke", "Kakabe"], ["kkf", "Kalaktang Monpa"], ["kkg", "Mabaka Valley Kalinga"], ["kkh", "Khün"], ["kki", "Kagulu"], ["kkj", "Kako"], ["kkk", "Kokota"], ["kkl", "Kosarek Yale"], ["kkm", "Kiong"], ["kkn", "Kon Keu"], ["kko", "Karko"], ["kkp", "Gugubera, Koko-Bera"], ["kkq", "Kaeku"], ["kkr", "Kir-Balar"], ["kks", "Giiwo"], ["kkt", "Koi"], ["kku", "Tumi"], ["kkv", "Kangean"], ["kkw", "Teke-Kukuya"], ["kkx", "Kohin"], ["kky", "Guugu Yimidhirr, Guguyimidjir"], ["kkz", "Kaska"], ["kla", "Klamath-Modoc"], ["klb", "Kiliwa"], ["klc", "Kolbila"], ["kld", "Gamilaraay"], ["kle", "Kulung (Nepal)"], ["klf", "Kendeje"], ["klg", "Tagakaulo"], ["klh", "Weliki"], ["kli", "Kalumpang"], ["klj", "Khalaj"], ["klk", "Kono (Nigeria)"], ["kll", "Kagan Kalagan"], ["klm", "Migum"], ["kln", "Kalenjin"], ["klo", "Kapya"], ["klp", "Kamasa"], ["klq", "Rumu"], ["klr", "Khaling"], ["kls", "Kalasha"], ["klt", "Nukna"], ["klu", "Klao"], ["klv", "Maskelynes"], ["klw", "Tado, Lindu"], ["klx", "Koluwawa"], ["kly", "Kalao"], ["klz", "Kabola"], ["kma", "Konni"], ["kmb", "Kimbundu"], ["kmc", "Southern Dong"], ["kmd", "Majukayang Kalinga"], ["kme", "Bakole"], ["kmf", "Kare (Papua New Guinea)"], ["kmg", "Kâte"], ["kmh", "Kalam"], ["kmi", "Kami (Nigeria)"], ["kmj", "Kumarbhag Paharia"], ["kmk", "Limos Kalinga"], ["kml", "Tanudan Kalinga"], ["kmm", "Kom (India)"], ["kmn", "Awtuw"], ["kmo", "Kwoma"], ["kmp", "Gimme"], ["kmq", "Kwama"], ["kmr", "Northern Kurdish"], ["kms", "Kamasau"], ["kmt", "Kemtuik"], ["kmu", "Kanite"], ["kmv", "Karipúna Creole French"], ["kmw", "Komo (Democratic Republic of Congo)"], ["kmx", "Waboda"], ["kmy", "Koma"], ["kmz", "Khorasani Turkish"], ["kna", "Dera (Nigeria)"], ["knb", "Lubuagan Kalinga"], ["knc", "Central Kanuri"], ["knd", "Konda"], ["kne", "Kankanaey"], ["knf", "Mankanya"], ["kng", "Koongo"], ["kni", "Kanufi"], ["knj", "Western Kanjobal"], ["knk", "Kuranko"], ["knl", "Keninjal"], ["knm", "Kanamarí"], ["knn", "Konkani (individual language)"], ["kno", "Kono (Sierra Leone)"], ["knp", "Kwanja"], ["knq", "Kintaq"], ["knr", "Kaningra"], ["kns", "Kensiu"], ["knt", "Panoan Katukína"], ["knu", "Kono (Guinea)"], ["knv", "Tabo"], ["knw", "Kung-Ekoka"], ["knx", "Kendayan, Salako"], ["kny", "Kanyok"], ["knz", "Kalamsé"], ["koa", "Konomala"], ["koc", "Kpati"], ["kod", "Kodi"], ["koe", "Kacipo-Bale Suri"], ["kof", "Kubi"], ["kog", "Cogui, Kogi"], ["koh", "Koyo"], ["koi", "Komi-Permyak"], ["koj", "Sara Dunjo"], ["kok", "Konkani (macrolanguage)"], ["kol", "Kol (Papua New Guinea)"], ["koo", "Konzo"], ["kop", "Waube"], ["koq", "Kota (Gabon)"], ["kos", "Kosraean"], ["kot", "Lagwan"], ["kou", "Koke"], ["kov", "Kudu-Camo"], ["kow", "Kugama"], ["kox", "Coxima"], ["koy", "Koyukon"], ["koz", "Korak"], ["kpa", "Kutto"], ["kpb", "Mullu Kurumba"], ["kpc", "Curripaco"], ["kpd", "Koba"], ["kpe", "Kpelle"], ["kpf", "Komba"], ["kpg", "Kapingamarangi"], ["kph", "Kplang"], ["kpi", "Kofei"], ["kpj", "Karajá"], ["kpk", "Kpan"], ["kpl", "Kpala"], ["kpm", "Koho"], ["kpn", "Kepkiriwát"], ["kpo", "Ikposo"], ["kpp", "Paku Karen"], ["kpq", "Korupun-Sela"], ["kpr", "Korafe-Yegha"], ["kps", "Tehit"], ["kpt", "Karata"], ["kpu", "Kafoa"], ["kpv", "Komi-Zyrian"], ["kpw", "Kobon"], ["kpx", "Mountain Koiali"], ["kpy", "Koryak"], ["kpz", "Kupsabiny"], ["kqa", "Mum"], ["kqb", "Kovai"], ["kqc", "Doromu-Koki"], ["kqd", "Koy Sanjaq Surat"], ["kqe", "Kalagan"], ["kqf", "Kakabai"], ["kqg", "Khe"], ["kqh", "Kisankasa"], ["kqi", "Koitabu"], ["kqj", "Koromira"], ["kqk", "Kotafon Gbe"], ["kql", "Kyenele"], ["kqm", "Khisa"], ["kqn", "Kaonde"], ["kqo", "Eastern Krahn"], ["kqp", "Kimré"], ["kqq", "Krenak"], ["kqr", "Kimaragang"], ["kqs", "Northern Kissi"], ["kqt", "Klias River Kadazan"], ["kqu", "Seroa"], ["kqv", "Okolod"], ["kqw", "Kandas"], ["kqx", "Mser"], ["kqy", "Koorete"], ["kqz", "Korana"], ["kra", "Kumhali"], ["krb", "Karkin"], ["krc", "Karachay-Balkar"], ["krd", "Kairui-Midiki"], ["kre", "Panará"], ["krf", "Koro (Vanuatu)"], ["krh", "Kurama"], ["kri", "Krio"], ["krj", "Kinaray-A"], ["krk", "Kerek"], ["krl", "Karelian"], ["krm", "Krim"], ["krn", "Sapo"], ["kro", "Kru languages"], ["krp", "Korop"], ["krr", "Krung"], ["krs", "Gbaya (Sudan)"], ["krt", "Tumari Kanuri"], ["kru", "Kurukh"], ["krv", "Kavet"], ["krw", "Western Krahn"], ["krx", "Karon"], ["kry", "Kryts"], ["krz", "Sota Kanum"], ["ksa", "Shuwa-Zamani"], ["ksb", "Shambala"], ["ksc", "Southern Kalinga"], ["ksd", "Kuanua"], ["kse", "Kuni"], ["ksf", "Bafia"], ["ksg", "Kusaghe"], ["ksh", "Kölsch"], ["ksi", "Krisa, I'saka"], ["ksj", "Uare"], ["ksk", "Kansa"], ["ksl", "Kumalu"], ["ksm", "Kumba"], ["ksn", "Kasiguranin"], ["kso", "Kofa"], ["ksp", "Kaba"], ["ksq", "Kwaami"], ["ksr", "Borong"], ["kss", "Southern Kisi"], ["kst", "Winyé"], ["ksu", "Khamyang"], ["ksv", "Kusu"], ["ksw", "S'gaw Karen"], ["ksx", "Kedang"], ["ksy", "Kharia Thar"], ["ksz", "Kodaku"], ["kta", "Katua"], ["ktb", "Kambaata"], ["ktc", "Kholok"], ["ktd", "Kokata, Kukatha"], ["kte", "Nubri"], ["ktf", "Kwami"], ["ktg", "Kalkutung"], ["kth", "Karanga"], ["kti", "North Muyu"], ["ktj", "Plapo Krumen"], ["ktk", "Kaniet"], ["ktl", "Koroshi"], ["ktm", "Kurti"], ["ktn", "Karitiâna"], ["kto", "Kuot"], ["ktp", "Kaduo"], ["ktq", "Katabaga"], ["ktr", "Kota Marudu Tinagas"], ["kts", "South Muyu"], ["ktt", "Ketum"], ["ktu", "Kituba (Democratic Republic of Congo)"], ["ktv", "Eastern Katu"], ["ktw", "Kato"], ["ktx", "Kaxararí"], ["kty", "Kango (Bas-Uélé District)"], ["ktz", "Juǀʼhoan, Juǀʼhoansi"], ["kub", "Kutep"], ["kuc", "Kwinsu"], ["kud", "'Auhelawa"], ["kue", "Kuman (Papua New Guinea)"], ["kuf", "Western Katu"], ["kug", "Kupa"], ["kuh", "Kushi"], ["kui", "Kuikúro-Kalapálo, Kalapalo"], ["kuj", "Kuria"], ["kuk", "Kepo'"], ["kul", "Kulere"], ["kum", "Kumyk"], ["kun", "Kunama"], ["kuo", "Kumukio"], ["kup", "Kunimaipa"], ["kuq", "Karipuna"], ["kus", "Kusaal"], ["kut", "Kutenai"], ["kuu", "Upper Kuskokwim"], ["kuv", "Kur"], ["kuw", "Kpagua"], ["kux", "Kukatja"], ["kuy", "Kuuku-Ya'u"], ["kuz", "Kunza"], ["kva", "Bagvalal"], ["kvb", "Kubu"], ["kvc", "Kove"], ["kvd", "Kui (Indonesia)"], ["kve", "Kalabakan"], ["kvf", "Kabalai"], ["kvg", "Kuni-Boazi"], ["kvh", "Komodo"], ["kvi", "Kwang"], ["kvj", "Psikye"], ["kvk", "Korean Sign Language"], ["kvl", "Kayaw"], ["kvm", "Kendem"], ["kvn", "Border Kuna"], ["kvo", "Dobel"], ["kvp", "Kompane"], ["kvq", "Geba Karen"], ["kvr", "Kerinci"], ["kvs", "Kunggara"], ["kvt", "Lahta Karen, Lahta"], ["kvu", "Yinbaw Karen"], ["kvv", "Kola"], ["kvw", "Wersing"], ["kvx", "Parkari Koli"], ["kvy", "Yintale Karen, Yintale"], ["kvz", "Tsakwambo, Tsaukambo"], ["kwa", "Dâw"], ["kwb", "Kwa"], ["kwc", "Likwala"], ["kwd", "Kwaio"], ["kwe", "Kwerba"], ["kwf", "Kwara'ae"], ["kwg", "Sara Kaba Deme"], ["kwh", "Kowiai"], ["kwi", "Awa-Cuaiquer"], ["kwj", "Kwanga"], ["kwk", "Kwakiutl"], ["kwl", "Kofyar"], ["kwm", "Kwambi"], ["kwn", "Kwangali"], ["kwo", "Kwomtari"], ["kwp", "Kodia"], ["kwq", "Kwak"], ["kwr", "Kwer"], ["kws", "Kwese"], ["kwt", "Kwesten"], ["kwu", "Kwakum"], ["kwv", "Sara Kaba Náà"], ["kww", "Kwinti"], ["kwx", "Khirwar"], ["kwy", "San Salvador Kongo"], ["kwz", "Kwadi"], ["kxa", "Kairiru"], ["kxb", "Krobu"], ["kxc", "Konso, Khonso"], ["kxd", "Brunei"], ["kxe", "Kakihum"], ["kxf", "Manumanaw Karen, Manumanaw"], ["kxh", "Karo (Ethiopia)"], ["kxi", "Keningau Murut"], ["kxj", "Kulfa"], ["kxk", "Zayein Karen"], ["kxl", "Nepali Kurux"], ["kxm", "Northern Khmer"], ["kxn", "Kanowit-Tanjong Melanau"], ["kxo", "Kanoé"], ["kxp", "Wadiyara Koli"], ["kxq", "Smärky Kanum"], ["kxr", "Koro (Papua New Guinea)"], ["kxs", "Kangjia"], ["kxt", "Koiwat"], ["kxu", "Kui (India)"], ["kxv", "Kuvi"], ["kxw", "Konai"], ["kxx", "Likuba"], ["kxy", "Kayong"], ["kxz", "Kerewo"], ["kya", "Kwaya"], ["kyb", "Butbut Kalinga"], ["kyc", "Kyaka"], ["kyd", "Karey"], ["kye", "Krache"], ["kyf", "Kouya"], ["kyg", "Keyagana"], ["kyh", "Karok"], ["kyi", "Kiput"], ["kyj", "Karao"], ["kyk", "Kamayo"], ["kyl", "Kalapuya"], ["kym", "Kpatili"], ["kyn", "Northern Binukidnon"], ["kyo", "Kelon"], ["kyp", "Kang"], ["kyq", "Kenga"], ["kyr", "Kuruáya"], ["kys", "Baram Kayan"], ["kyt", "Kayagar"], ["kyu", "Western Kayah"], ["kyv", "Kayort"], ["kyw", "Kudmali"], ["kyx", "Rapoisi"], ["kyy", "Kambaira"], ["kyz", "Kayabí"], ["kza", "Western Karaboro"], ["kzb", "Kaibobo"], ["kzc", "Bondoukou Kulango"], ["kzd", "Kadai"], ["kze", "Kosena"], ["kzf", "Da'a Kaili"], ["kzg", "Kikai"], ["kzh", "Kenuzi-Dongola"], ["kzi", "Kelabit"], ["kzj", "Coastal Kadazan"], ["kzk", "Kazukuru"], ["kzl", "Kayeli"], ["kzm", "Kais"], ["kzn", "Kokola"], ["kzo", "Kaningi"], ["kzp", "Kaidipang"], ["kzq", "Kaike"], ["kzr", "Karang"], ["kzs", "Sugut Dusun"], ["kzt", "Tambunan Dusun"], ["kzu", "Kayupulau"], ["kzv", "Komyandaret"], ["kzw", "Karirí-Xocó"], ["kzx", "Kamarian"], ["kzy", "Kango (Tshopo District)"], ["kzz", "Kalabra"], ["laa", "Southern Subanen"], ["lab", "Linear A"], ["lac", "Lacandon"], ["lad", "Ladino"], ["lae", "Pattani"], ["laf", "Lafofa"], ["lag", "Langi"], ["lah", "Lahnda"], ["lai", "Lambya"], ["laj", "Lango (Uganda)"], ["lak", "Laka (Nigeria)"], ["lal", "Lalia"], ["lam", "Lamba"], ["lan", "Laru"], ["lap", "Laka (Chad)"], ["laq", "Qabiao"], ["lar", "Larteh"], ["las", "Lama (Togo)"], ["lau", "Laba"], ["law", "Lauje"], ["lax", "Tiwa"], ["lay", "Lama Bai"], ["laz", "Aribwatsa"], ["lba", "Lui"], ["lbb", "Label"], ["lbc", "Lakkia"], ["lbe", "Lak"], ["lbf", "Tinani"], ["lbg", "Laopang"], ["lbi", "La'bi"], ["lbj", "Ladakhi"], ["lbk", "Central Bontok"], ["lbl", "Libon Bikol"], ["lbm", "Lodhi"], ["lbn", "Rmeet"], ["lbo", "Laven"], ["lbq", "Wampar"], ["lbr", "Lohorung"], ["lbs", "Libyan Sign Language"], ["lbt", "Lachi"], ["lbu", "Labu"], ["lbv", "Lavatbura-Lamusong"], ["lbw", "Tolaki"], ["lbx", "Lawangan"], ["lby", "Lamalama, Lamu-Lamu"], ["lbz", "Lardil"], ["lcc", "Legenyem"], ["lcd", "Lola"], ["lce", "Loncong, Sekak"], ["lcf", "Lubu"], ["lch", "Luchazi"], ["lcl", "Lisela"], ["lcm", "Tungag"], ["lcp", "Western Lawa"], ["lcq", "Luhu"], ["lcs", "Lisabata-Nuniali"], ["lda", "Kla-Dan"], ["ldb", "Dũya"], ["ldd", "Luri"], ["ldg", "Lenyima"], ["ldh", "Lamja-Dengsa-Tola"], ["ldi", "Laari"], ["ldj", "Lemoro"], ["ldk", "Leelau"], ["ldl", "Kaan"], ["ldm", "Landoma"], ["ldn", "Láadan"], ["ldo", "Loo"], ["ldp", "Tso"], ["ldq", "Lufu"], ["lea", "Lega-Shabunda"], ["leb", "Lala-Bisa"], ["lec", "Leco"], ["led", "Lendu"], ["lee", "Lyélé"], ["lef", "Lelemi"], ["leg", "Lengua"], ["leh", "Lenje"], ["lei", "Lemio"], ["lej", "Lengola"], ["lek", "Leipon"], ["lel", "Lele (Democratic Republic of Congo)"], ["lem", "Nomaande"], ["len", "Lenca"], ["leo", "Leti (Cameroon)"], ["lep", "Lepcha"], ["leq", "Lembena"], ["ler", "Lenkau"], ["les", "Lese"], ["let", "Lesing-Gelimi, Amio-Gelimi"], ["leu", "Kara (Papua New Guinea)"], ["lev", "Lamma"], ["lew", "Ledo Kaili"], ["lex", "Luang"], ["ley", "Lemolang"], ["lez", "Lezghian"], ["lfa", "Lefa"], ["lfn", "Lingua Franca Nova"], ["lga", "Lungga"], ["lgb", "Laghu"], ["lgg", "Lugbara"], ["lgh", "Laghuu"], ["lgi", "Lengilu"], ["lgk", "Lingarak, Neverver"], ["lgl", "Wala"], ["lgm", "Lega-Mwenga"], ["lgn", "T'apo, Opuuo"], ["lgq", "Logba"], ["lgr", "Lengo"], ["lgt", "Pahi"], ["lgu", "Longgu"], ["lgz", "Ligenza"], ["lha", "Laha (Viet Nam)"], ["lhh", "Laha (Indonesia)"], ["lhi", "Lahu Shi"], ["lhl", "Lahul Lohar"], ["lhm", "Lhomi"], ["lhn", "Lahanan"], ["lhp", "Lhokpu"], ["lhs", "Mlahsö"], ["lht", "Lo-Toga"], ["lhu", "Lahu"], ["lia", "West-Central Limba"], ["lib", "Likum"], ["lic", "Hlai"], ["lid", "Nyindrou"], ["lie", "Likila"], ["lif", "Limbu"], ["lig", "Ligbi"], ["lih", "Lihir"], ["lii", "Lingkhim"], ["lij", "Ligurian"], ["lik", "Lika"], ["lil", "Lillooet"], ["lio", "Liki"], ["lip", "Sekpele"], ["liq", "Libido"], ["lir", "Liberian English"], ["lis", "Lisu"], ["liu", "Logorik"], ["liv", "Liv"], ["liw", "Col"], ["lix", "Liabuku"], ["liy", "Banda-Bambari"], ["liz", "Libinza"], ["lja", "Golpa"], ["lje", "Rampi"], ["lji", "Laiyolo"], ["ljl", "Li'o"], ["ljp", "Lampung Api"], ["ljw", "Yirandali"], ["ljx", "Yuru"], ["lka", "Lakalei"], ["lkb", "Kabras, Lukabaras"], ["lkc", "Kucong"], ["lkd", "Lakondê"], ["lke", "Kenyi"], ["lkh", "Lakha"], ["lki", "Laki"], ["lkj", "Remun"], ["lkl", "Laeko-Libuat"], ["lkm", "Kalaamaya"], ["lkn", "Lakon, Vure"], ["lko", "Khayo, Olukhayo"], ["lkr", "Päri"], ["lks", "Kisa, Olushisa"], ["lkt", "Lakota"], ["lku", "Kungkari"], ["lky", "Lokoya"], ["lla", "Lala-Roba"], ["llb", "Lolo"], ["llc", "Lele (Guinea)"], ["lld", "Ladin"], ["lle", "Lele (Papua New Guinea)"], ["llf", "Hermit"], ["llg", "Lole"], ["llh", "Lamu"], ["lli", "Teke-Laali"], ["llj", "Ladji Ladji"], ["llk", "Lelak"], ["lll", "Lilau"], ["llm", "Lasalimu"], ["lln", "Lele (Chad)"], ["llo", "Khlor"], ["llp", "North Efate"], ["llq", "Lolak"], ["lls", "Lithuanian Sign Language"], ["llu", "Lau"], ["llx", "Lauan"], ["lma", "East Limba"], ["lmb", "Merei"], ["lmc", "Limilngan"], ["lmd", "Lumun"], ["lme", "Pévé"], ["lmf", "South Lembata"], ["lmg", "Lamogai"], ["lmh", "Lambichhong"], ["lmi", "Lombi"], ["lmj", "West Lembata"], ["lmk", "Lamkang"], ["lml", "Hano"], ["lmm", "Lamam"], ["lmn", "Lambadi"], ["lmo", "Lombard"], ["lmp", "Limbum"], ["lmq", "Lamatuka"], ["lmr", "Lamalera"], ["lmu", "Lamenu"], ["lmv", "Lomaiviti"], ["lmw", "Lake Miwok"], ["lmx", "Laimbue"], ["lmy", "Lamboya"], ["lmz", "Lumbee"], ["lna", "Langbashe"], ["lnb", "Mbalanhu"], ["lnd", "Lundayeh, Lun Bawang"], ["lng", "Langobardic"], ["lnh", "Lanoh"], ["lni", "Daantanai'"], ["lnj", "Leningitij"], ["lnl", "South Central Banda"], ["lnm", "Langam"], ["lnn", "Lorediakarkar"], ["lno", "Lango (South Sudan)"], ["lns", "Lamnso'"], ["lnu", "Longuda"], ["lnw", "Lanima"], ["lnz", "Lonzo"], ["loa", "Loloda"], ["lob", "Lobi"], ["loc", "Inonhan"], ["loe", "Saluan"], ["lof", "Logol"], ["log", "Logo"], ["loh", "Narim"], ["loi", "Loma (Côte d'Ivoire)"], ["loj", "Lou"], ["lok", "Loko"], ["lol", "Mongo"], ["lom", "Loma (Liberia)"], ["lon", "Malawi Lomwe"], ["loo", "Lombo"], ["lop", "Lopa"], ["loq", "Lobala"], ["lor", "Téén"], ["los", "Loniu"], ["lot", "Otuho"], ["lou", "Louisiana Creole"], ["lov", "Lopi"], ["low", "Tampias Lobu"], ["lox", "Loun"], ["loy", "Loke"], ["loz", "Lozi"], ["lpa", "Lelepa"], ["lpe", "Lepki"], ["lpn", "Long Phuri Naga"], ["lpo", "Lipo"], ["lpx", "Lopit"], ["lra", "Rara Bakati'"], ["lrc", "Northern Luri"], ["lre", "Laurentian"], ["lrg", "Laragia"], ["lri", "Marachi, Olumarachi"], ["lrk", "Loarki"], ["lrl", "Lari"], ["lrm", "Marama, Olumarama"], ["lrn", "Lorang"], ["lro", "Laro"], ["lrr", "Southern Yamphu"], ["lrt", "Larantuka Malay"], ["lrv", "Larevat"], ["lrz", "Lemerig"], ["lsa", "Lasgerdi"], ["lsb", "Burundian Sign Language, Langue des Signes Burundaise"], ["lsd", "Lishana Deni"], ["lse", "Lusengo"], ["lsg", "Lyons Sign Language"], ["lsh", "Lish"], ["lsi", "Lashi"], ["lsl", "Latvian Sign Language"], ["lsm", "Saamia, Olusamia"], ["lsn", "Tibetan Sign Language"], ["lso", "Laos Sign Language"], ["lsp", "Panamanian Sign Language, Lengua de Señas Panameñas"], ["lsr", "Aruop"], ["lss", "Lasi"], ["lst", "Trinidad and Tobago Sign Language"], ["lsv", "Sivia Sign Language"], ["lsy", "Mauritian Sign Language"], ["ltc", "Late Middle Chinese"], ["ltg", "Latgalian"], ["lth", "Thur"], ["lti", "Leti (Indonesia)"], ["ltn", "Latundê"], ["lto", "Tsotso, Olutsotso"], ["lts", "Tachoni, Lutachoni"], ["ltu", "Latu"], ["lua", "Luba-Lulua"], ["luc", "Aringa"], ["lud", "Ludian"], ["lue", "Luvale"], ["luf", "Laua"], ["lui", "Luiseno"], ["luj", "Luna"], ["luk", "Lunanakha"], ["lul", "Olu'bo"], ["lum", "Luimbi"], ["lun", "Lunda"], ["luo", "Luo (Kenya and Tanzania), Dholuo"], ["lup", "Lumbu"], ["luq", "Lucumi"], ["lur", "Laura"], ["lus", "Lushai"], ["lut", "Lushootseed"], ["luu", "Lumba-Yakkha"], ["luv", "Luwati"], ["luw", "Luo (Cameroon)"], ["luy", "Luyia, Oluluyia"], ["luz", "Southern Luri"], ["lva", "Maku'a"], ["lvi", "Lavi"], ["lvk", "Lavukaleve"], ["lvs", "Standard Latvian"], ["lvu", "Levuka"], ["lwa", "Lwalu"], ["lwe", "Lewo Eleng"], ["lwg", "Wanga, Oluwanga"], ["lwh", "White Lachi"], ["lwl", "Eastern Lawa"], ["lwm", "Laomian"], ["lwo", "Luwo"], ["lws", "Malawian Sign Language"], ["lwt", "Lewotobi"], ["lwu", "Lawu"], ["lww", "Lewo"], ["lxm", "Lakurumau"], ["lya", "Layakha"], ["lyg", "Lyngngam"], ["lyn", "Luyana"], ["lzh", "Literary Chinese"], ["lzl", "Litzlitz"], ["lzn", "Leinong Naga"], ["lzz", "Laz"], ["maa", "San Jerónimo Tecóatl Mazatec"], ["mab", "Yutanduchi Mixtec"], ["mad", "Madurese"], ["mae", "Bo-Rukul"], ["maf", "Mafa"], ["mag", "Magahi"], ["mai", "Maithili"], ["maj", "Jalapa De Díaz Mazatec"], ["mak", "Makasar"], ["mam", "Mam"], ["man", "Mandingo, Manding"], ["map", "Austronesian languages"], ["maq", "Chiquihuitlán Mazatec"], ["mas", "Masai"], ["mat", "San Francisco Matlatzinca"], ["mau", "Huautla Mazatec"], ["mav", "Sateré-Mawé"], ["maw", "Mampruli"], ["max", "North Moluccan Malay"], ["maz", "Central Mazahua"], ["mba", "Higaonon"], ["mbb", "Western Bukidnon Manobo"], ["mbc", "Macushi"], ["mbd", "Dibabawon Manobo"], ["mbe", "Molale"], ["mbf", "Baba Malay"], ["mbh", "Mangseng"], ["mbi", "Ilianen Manobo"], ["mbj", "Nadëb"], ["mbk", "Malol"], ["mbl", "Maxakalí"], ["mbm", "Ombamba"], ["mbn", "Macaguán"], ["mbo", "Mbo (Cameroon)"], ["mbp", "Malayo"], ["mbq", "Maisin"], ["mbr", "Nukak Makú"], ["mbs", "Sarangani Manobo"], ["mbt", "Matigsalug Manobo"], ["mbu", "Mbula-Bwazza"], ["mbv", "Mbulungish"], ["mbw", "Maring"], ["mbx", "Mari (East Sepik Province)"], ["mby", "Memoni"], ["mbz", "Amoltepec Mixtec"], ["mca", "Maca"], ["mcb", "Machiguenga"], ["mcc", "Bitur"], ["mcd", "Sharanahua"], ["mce", "Itundujia Mixtec"], ["mcf", "Matsés"], ["mcg", "Mapoyo"], ["mch", "Maquiritari"], ["mci", "Mese"], ["mcj", "Mvanip"], ["mck", "Mbunda"], ["mcl", "Macaguaje"], ["mcm", "Malaccan Creole Portuguese"], ["mcn", "Masana"], ["mco", "Coatlán Mixe"], ["mcp", "Makaa"], ["mcq", "Ese"], ["mcr", "Menya"], ["mcs", "Mambai"], ["mct", "Mengisa"], ["mcu", "Cameroon Mambila"], ["mcv", "Minanibai"], ["mcw", "Mawa (Chad)"], ["mcx", "Mpiemo"], ["mcy", "South Watut"], ["mcz", "Mawan"], ["mda", "Mada (Nigeria)"], ["mdb", "Morigi"], ["mdc", "Male (Papua New Guinea)"], ["mdd", "Mbum"], ["mde", "Maba (Chad)"], ["mdf", "Moksha"], ["mdg", "Massalat"], ["mdh", "Maguindanaon"], ["mdi", "Mamvu"], ["mdj", "Mangbetu"], ["mdk", "Mangbutu"], ["mdl", "Maltese Sign Language"], ["mdm", "Mayogo"], ["mdn", "Mbati"], ["mdp", "Mbala"], ["mdq", "Mbole"], ["mdr", "Mandar"], ["mds", "Maria (Papua New Guinea)"], ["mdt", "Mbere"], ["mdu", "Mboko"], ["mdv", "Santa Lucía Monteverde Mixtec"], ["mdw", "Mbosi"], ["mdx", "Dizin"], ["mdy", "Male (Ethiopia)"], ["mdz", "Suruí Do Pará"], ["mea", "Menka"], ["meb", "Ikobi"], ["mec", "Marra"], ["med", "Melpa"], ["mee", "Mengen"], ["mef", "Megam"], ["meg", "Mea"], ["meh", "Southwestern Tlaxiaco Mixtec"], ["mei", "Midob"], ["mej", "Meyah"], ["mek", "Mekeo"], ["mel", "Central Melanau"], ["mem", "Mangala"], ["men", "Mende (Sierra Leone)"], ["meo", "Kedah Malay"], ["mep", "Miriwoong"], ["meq", "Merey"], ["mer", "Meru"], ["mes", "Masmaje"], ["met", "Mato"], ["meu", "Motu"], ["mev", "Mano"], ["mew", "Maaka"], ["mey", "Hassaniyya"], ["mez", "Menominee"], ["mfa", "Pattani Malay"], ["mfb", "Bangka"], ["mfc", "Mba"], ["mfd", "Mendankwe-Nkwen"], ["mfe", "Morisyen"], ["mff", "Naki"], ["mfg", "Mogofin"], ["mfh", "Matal"], ["mfi", "Wandala"], ["mfj", "Mefele"], ["mfk", "North Mofu"], ["mfl", "Putai"], ["mfm", "Marghi South"], ["mfn", "Cross River Mbembe"], ["mfo", "Mbe"], ["mfp", "Makassar Malay"], ["mfq", "Moba"], ["mfr", "Marrithiyel"], ["mfs", "Mexican Sign Language"], ["mft", "Mokerang"], ["mfu", "Mbwela"], ["mfv", "Mandjak"], ["mfw", "Mulaha"], ["mfx", "Melo"], ["mfy", "Mayo"], ["mfz", "Mabaan"], ["mga", "Middle Irish (900-1200)"], ["mgb", "Mararit"], ["mgc", "Morokodo"], ["mgd", "Moru"], ["mge", "Mango"], ["mgf", "Maklew"], ["mgg", "Mpumpong"], ["mgh", "Makhuwa-Meetto"], ["mgi", "Lijili"], ["mgj", "Abureni"], ["mgk", "Mawes"], ["mgl", "Maleu-Kilenge"], ["mgm", "Mambae"], ["mgn", "Mbangi"], ["mgo", "Meta'"], ["mgp", "Eastern Magar"], ["mgq", "Malila"], ["mgr", "Mambwe-Lungu"], ["mgs", "Manda (Tanzania)"], ["mgt", "Mongol"], ["mgu", "Mailu"], ["mgv", "Matengo"], ["mgw", "Matumbi"], ["mgx", "Omati"], ["mgy", "Mbunga"], ["mgz", "Mbugwe"], ["mha", "Manda (India)"], ["mhb", "Mahongwe"], ["mhc", "Mocho"], ["mhd", "Mbugu"], ["mhe", "Besisi, Mah Meri"], ["mhf", "Mamaa"], ["mhg", "Margu"], ["mhh", "Maskoy Pidgin"], ["mhi", "Ma'di"], ["mhj", "Mogholi"], ["mhk", "Mungaka"], ["mhl", "Mauwake"], ["mhm", "Makhuwa-Moniga"], ["mhn", "Mócheno"], ["mho", "Mashi (Zambia)"], ["mhp", "Balinese Malay"], ["mhq", "Mandan"], ["mhr", "Eastern Mari"], ["mhs", "Buru (Indonesia)"], ["mht", "Mandahuaca"], ["mhu", "Digaro-Mishmi, Darang Deng"], ["mhw", "Mbukushu"], ["mhx", "Maru, Lhaovo"], ["mhy", "Ma'anyan"], ["mhz", "Mor (Mor Islands)"], ["mia", "Miami"], ["mib", "Atatláhuca Mixtec"], ["mic", "Mi'kmaq, Micmac"], ["mid", "Mandaic"], ["mie", "Ocotepec Mixtec"], ["mif", "Mofu-Gudur"], ["mig", "San Miguel El Grande Mixtec"], ["mih", "Chayuco Mixtec"], ["mii", "Chigmecatitlán Mixtec"], ["mij", "Abar, Mungbam"], ["mik", "Mikasuki"], ["mil", "Peñoles Mixtec"], ["mim", "Alacatlatzala Mixtec"], ["min", "Minangkabau"], ["mio", "Pinotepa Nacional Mixtec"], ["mip", "Apasco-Apoala Mixtec"], ["miq", "Mískito"], ["mir", "Isthmus Mixe"], ["mis", "Uncoded languages"], ["mit", "Southern Puebla Mixtec"], ["miu", "Cacaloxtepec Mixtec"], ["miw", "Akoye"], ["mix", "Mixtepec Mixtec"], ["miy", "Ayutla Mixtec"], ["miz", "Coatzospan Mixtec"], ["mja", "Mahei"], ["mjb", "Makalero"], ["mjc", "San Juan Colorado Mixtec"], ["mjd", "Northwest Maidu"], ["mje", "Muskum"], ["mjg", "Tu"], ["mjh", "Mwera (Nyasa)"], ["mji", "Kim Mun"], ["mjj", "Mawak"], ["mjk", "Matukar"], ["mjl", "Mandeali"], ["mjm", "Medebur"], ["mjn", "Ma (Papua New Guinea)"], ["mjo", "Malankuravan"], ["mjp", "Malapandaram"], ["mjq", "Malaryan"], ["mjr", "Malavedan"], ["mjs", "Miship"], ["mjt", "Sauria Paharia"], ["mju", "Manna-Dora"], ["mjv", "Mannan"], ["mjw", "Karbi"], ["mjx", "Mahali"], ["mjy", "Mahican"], ["mjz", "Majhi"], ["mka", "Mbre"], ["mkb", "Mal Paharia"], ["mkc", "Siliput"], ["mke", "Mawchi"], ["mkf", "Miya"], ["mkg", "Mak (China)"], ["mkh", "Mon-Khmer languages"], ["mki", "Dhatki"], ["mkj", "Mokilese"], ["mkk", "Byep"], ["mkl", "Mokole"], ["mkm", "Moklen"], ["mkn", "Kupang Malay"], ["mko", "Mingang Doso"], ["mkp", "Moikodi"], ["mkq", "Bay Miwok"], ["mkr", "Malas"], ["mks", "Silacayoapan Mixtec"], ["mkt", "Vamale"], ["mku", "Konyanka Maninka"], ["mkv", "Mafea"], ["mkw", "Kituba (Congo)"], ["mkx", "Kinamiging Manobo"], ["mky", "East Makian"], ["mkz", "Makasae"], ["mla", "Malo"], ["mlb", "Mbule"], ["mlc", "Cao Lan"], ["mld", "Malakhel"], ["mle", "Manambu"], ["mlf", "Mal"], ["mlh", "Mape"], ["mli", "Malimpung"], ["mlj", "Miltu"], ["mlk", "Ilwana, Kiwilwana"], ["mll", "Malua Bay"], ["mlm", "Mulam"], ["mln", "Malango"], ["mlo", "Mlomp"], ["mlp", "Bargam"], ["mlq", "Western Maninkakan"], ["mlr", "Vame"], ["mls", "Masalit"], ["mlu", "To'abaita"], ["mlv", "Motlav, Mwotlap"], ["mlw", "Moloko"], ["mlx", "Malfaxal, Naha'ai"], ["mlz", "Malaynon"], ["mma", "Mama"], ["mmb", "Momina"], ["mmc", "Michoacán Mazahua"], ["mmd", "Maonan"], ["mme", "Mae"], ["mmf", "Mundat"], ["mmg", "North Ambrym"], ["mmh", "Mehináku"], ["mmi", "Musar"], ["mmj", "Majhwar"], ["mmk", "Mukha-Dora"], ["mml", "Man Met"], ["mmm", "Maii"], ["mmn", "Mamanwa"], ["mmo", "Mangga Buang"], ["mmp", "Siawi"], ["mmq", "Musak"], ["mmr", "Western Xiangxi Miao"], ["mmt", "Malalamai"], ["mmu", "Mmaala"], ["mmv", "Miriti"], ["mmw", "Emae"], ["mmx", "Madak"], ["mmy", "Migaama"], ["mmz", "Mabaale"], ["mna", "Mbula"], ["mnb", "Muna"], ["mnc", "Manchu"], ["mnd", "Mondé"], ["mne", "Naba"], ["mnf", "Mundani"], ["mng", "Eastern Mnong"], ["mnh", "Mono (Democratic Republic of Congo)"], ["mni", "Manipuri"], ["mnj", "Munji"], ["mnk", "Mandinka"], ["mnl", "Tiale"], ["mnm", "Mapena"], ["mnn", "Southern Mnong"], ["mno", "Manobo languages"], ["mnp", "Min Bei Chinese"], ["mnq", "Minriq"], ["mnr", "Mono (USA)"], ["mns", "Mansi"], ["mnt", "Maykulan"], ["mnu", "Mer"], ["mnv", "Rennell-Bellona"], ["mnw", "Mon"], ["mnx", "Manikion"], ["mny", "Manyawa"], ["mnz", "Moni"], ["moa", "Mwan"], ["moc", "Mocoví"], ["mod", "Mobilian"], ["moe", "Innu, Montagnais"], ["mof", "Mohegan-Montauk-Narragansett"], ["mog", "Mongondow"], ["moh", "Mohawk"], ["moi", "Mboi"], ["moj", "Monzombo"], ["mok", "Morori"], ["mom", "Mangue"], ["moo", "Monom"], ["mop", "Mopán Maya"], ["moq", "Mor (Bomberai Peninsula)"], ["mor", "Moro"], ["mos", "Mossi"], ["mot", "Barí"], ["mou", "Mogum"], ["mov", "Mohave"], ["mow", "Moi (Congo)"], ["mox", "Molima"], ["moy", "Shekkacho"], ["moz", "Mukulu, Gergiko"], ["mpa", "Mpoto"], ["mpb", "Malak Malak, Mullukmulluk"], ["mpc", "Mangarrayi"], ["mpd", "Machinere"], ["mpe", "Majang"], ["mpg", "Marba"], ["mph", "Maung"], ["mpi", "Mpade"], ["mpj", "Martu Wangka, Wangkajunga"], ["mpk", "Mbara (Chad)"], ["mpl", "Middle Watut"], ["mpm", "Yosondúa Mixtec"], ["mpn", "Mindiri"], ["mpo", "Miu"], ["mpp", "Migabac"], ["mpq", "Matís"], ["mpr", "Vangunu"], ["mps", "Dadibi"], ["mpt", "Mian"], ["mpu", "Makuráp"], ["mpv", "Mungkip"], ["mpw", "Mapidian"], ["mpx", "Misima-Panaeati"], ["mpy", "Mapia"], ["mpz", "Mpi"], ["mqa", "Maba (Indonesia)"], ["mqb", "Mbuko"], ["mqc", "Mangole"], ["mqe", "Matepi"], ["mqf", "Momuna"], ["mqg", "Kota Bangun Kutai Malay"], ["mqh", "Tlazoyaltepec Mixtec"], ["mqi", "Mariri"], ["mqj", "Mamasa"], ["mqk", "Rajah Kabunsuwan Manobo"], ["mql", "Mbelime"], ["mqm", "South Marquesan"], ["mqn", "Moronene"], ["mqo", "Modole"], ["mqp", "Manipa"], ["mqq", "Minokok"], ["mqr", "Mander"], ["mqs", "West Makian"], ["mqt", "Mok"], ["mqu", "Mandari"], ["mqv", "Mosimo"], ["mqw", "Murupi"], ["mqx", "Mamuju"], ["mqy", "Manggarai"], ["mqz", "Pano"], ["mra", "Mlabri"], ["mrb", "Marino"], ["mrc", "Maricopa"], ["mrd", "Western Magar"], ["mre", "Martha's Vineyard Sign Language"], ["mrf", "Elseng"], ["mrg", "Mising"], ["mrh", "Mara Chin"], ["mrj", "Western Mari"], ["mrk", "Hmwaveke"], ["mrl", "Mortlockese"], ["mrm", "Merlav, Mwerlap"], ["mrn", "Cheke Holo"], ["mro", "Mru"], ["mrp", "Morouas"], ["mrq", "North Marquesan"], ["mrr", "Maria (India)"], ["mrs", "Maragus"], ["mrt", "Marghi Central"], ["mru", "Mono (Cameroon)"], ["mrv", "Mangareva"], ["mrw", "Maranao"], ["mrx", "Maremgi, Dineor"], ["mry", "Mandaya"], ["mrz", "Marind"], ["msb", "Masbatenyo"], ["msc", "Sankaran Maninka"], ["msd", "Yucatec Maya Sign Language"], ["mse", "Musey"], ["msf", "Mekwei"], ["msg", "Moraid"], ["msh", "Masikoro Malagasy"], ["msi", "Sabah Malay"], ["msj", "Ma (Democratic Republic of Congo)"], ["msk", "Mansaka"], ["msl", "Molof, Poule"], ["msm", "Agusan Manobo"], ["msn", "Vurës"], ["mso", "Mombum"], ["msp", "Maritsauá"], ["msq", "Caac"], ["msr", "Mongolian Sign Language"], ["mss", "West Masela"], ["mst", "Cataelano Mandaya"], ["msu", "Musom"], ["msv", "Maslam"], ["msw", "Mansoanka"], ["msx", "Moresada"], ["msy", "Aruamu"], ["msz", "Momare"], ["mta", "Cotabato Manobo"], ["mtb", "Anyin Morofo"], ["mtc", "Munit"], ["mtd", "Mualang"], ["mte", "Mono (Solomon Islands)"], ["mtf", "Murik (Papua New Guinea)"], ["mtg", "Una"], ["mth", "Munggui"], ["mti", "Maiwa (Papua New Guinea)"], ["mtj", "Moskona"], ["mtk", "Mbe'"], ["mtl", "Montol"], ["mtm", "Mator"], ["mtn", "Matagalpa"], ["mto", "Totontepec Mixe"], ["mtp", "Wichí Lhamtés Nocten"], ["mtq", "Muong"], ["mtr", "Mewari"], ["mts", "Yora"], ["mtt", "Mota"], ["mtu", "Tututepec Mixtec"], ["mtv", "Asaro'o"], ["mtw", "Southern Binukidnon"], ["mtx", "Tidaá Mixtec"], ["mty", "Nabi"], ["mua", "Mundang"], ["mub", "Mubi"], ["muc", "Ajumbu"], ["mud", "Mednyj Aleut"], ["mue", "Media Lengua"], ["mug", "Musgu"], ["muh", "Mündü"], ["mui", "Musi"], ["muj", "Mabire"], ["muk", "Mugom"], ["mul", "Multiple languages"], ["mum", "Maiwala"], ["mun", "Munda languages"], ["muo", "Nyong"], ["mup", "Malvi"], ["muq", "Eastern Xiangxi Miao"], ["mur", "Murle"], ["mus", "Creek"], ["mut", "Western Muria"], ["muu", "Yaaku"], ["muv", "Muthuvan"], ["mux", "Bo-Ung"], ["muy", "Muyang"], ["muz", "Mursi"], ["mva", "Manam"], ["mvb", "Mattole"], ["mvd", "Mamboru"], ["mve", "Marwari (Pakistan)"], ["mvf", "Peripheral Mongolian"], ["mvg", "Yucuañe Mixtec"], ["mvh", "Mulgi"], ["mvi", "Miyako"], ["mvk", "Mekmek"], ["mvl", "Mbara (Australia)"], ["mvm", "Muya"], ["mvn", "Minaveha"], ["mvo", "Marovo"], ["mvp", "Duri"], ["mvq", "Moere"], ["mvr", "Marau"], ["mvs", "Massep"], ["mvt", "Mpotovoro"], ["mvu", "Marfa"], ["mvv", "Tagal Murut"], ["mvw", "Machinga"], ["mvx", "Meoswar"], ["mvy", "Indus Kohistani"], ["mvz", "Mesqan"], ["mwa", "Mwatebu"], ["mwb", "Juwal"], ["mwc", "Are"], ["mwd", "Mudbura"], ["mwe", "Mwera (Chimwera)"], ["mwf", "Murrinh-Patha"], ["mwg", "Aiklep"], ["mwh", "Mouk-Aria"], ["mwi", "Labo, Ninde"], ["mwj", "Maligo"], ["mwk", "Kita Maninkakan"], ["mwl", "Mirandese"], ["mwm", "Sar"], ["mwn", "Nyamwanga"], ["mwo", "Central Maewo"], ["mwp", "Kala Lagaw Ya"], ["mwq", "Mün Chin"], ["mwr", "Marwari"], ["mws", "Mwimbi-Muthambi"], ["mwt", "Moken"], ["mwu", "Mittu"], ["mwv", "Mentawai"], ["mww", "Hmong Daw"], ["mwx", "Mediak"], ["mwy", "Mosiro"], ["mwz", "Moingi"], ["mxa", "Northwest Oaxaca Mixtec"], ["mxb", "Tezoatlán Mixtec"], ["mxc", "Manyika"], ["mxd", "Modang"], ["mxe", "Mele-Fila"], ["mxf", "Malgbe"], ["mxg", "Mbangala"], ["mxh", "Mvuba"], ["mxi", "Mozarabic"], ["mxj", "Miju-Mishmi, Geman Deng"], ["mxk", "Monumbo"], ["mxl", "Maxi Gbe"], ["mxm", "Meramera"], ["mxn", "Moi (Indonesia)"], ["mxo", "Mbowe"], ["mxp", "Tlahuitoltepec Mixe"], ["mxq", "Juquila Mixe"], ["mxr", "Murik (Malaysia)"], ["mxs", "Huitepec Mixtec"], ["mxt", "Jamiltepec Mixtec"], ["mxu", "Mada (Cameroon)"], ["mxv", "Metlatónoc Mixtec"], ["mxw", "Namo"], ["mxx", "Mahou, Mawukakan"], ["mxy", "Southeastern Nochixtlán Mixtec"], ["mxz", "Central Masela"], ["myb", "Mbay"], ["myc", "Mayeka"], ["myd", "Maramba"], ["mye", "Myene"], ["myf", "Bambassi"], ["myg", "Manta"], ["myh", "Makah"], ["myi", "Mina (India)"], ["myj", "Mangayat"], ["myk", "Mamara Senoufo"], ["myl", "Moma"], ["mym", "Me'en"], ["myn", "Mayan languages"], ["myo", "Anfillo"], ["myp", "Pirahã"], ["myq", "Forest Maninka"], ["myr", "Muniche"], ["mys", "Mesmes"], ["myt", "Sangab Mandaya"], ["myu", "Mundurukú"], ["myv", "Erzya"], ["myw", "Muyuw"], ["myx", "Masaaba"], ["myy", "Macuna"], ["myz", "Classical Mandaic"], ["mza", "Santa María Zacatepec Mixtec"], ["mzb", "Tumzabt"], ["mzc", "Madagascar Sign Language"], ["mzd", "Malimba"], ["mze", "Morawa"], ["mzg", "Monastic Sign Language"], ["mzh", "Wichí Lhamtés Güisnay"], ["mzi", "Ixcatlán Mazatec"], ["mzj", "Manya"], ["mzk", "Nigeria Mambila"], ["mzl", "Mazatlán Mixe"], ["mzm", "Mumuye"], ["mzn", "Mazanderani"], ["mzo", "Matipuhy"], ["mzp", "Movima"], ["mzq", "Mori Atas"], ["mzr", "Marúbo"], ["mzs", "Macanese"], ["mzt", "Mintil"], ["mzu", "Inapang"], ["mzv", "Manza"], ["mzw", "Deg"], ["mzx", "Mawayana"], ["mzy", "Mozambican Sign Language"], ["mzz", "Maiadomu"], ["naa", "Namla"], ["nab", "Southern Nambikuára"], ["nac", "Narak"], ["nad", "Nijadali"], ["nae", "Naka'ela"], ["naf", "Nabak"], ["nag", "Naga Pidgin"], ["nah", "Nahuatl languages"], ["nai", "North American Indian languages"], ["naj", "Nalu"], ["nak", "Nakanai"], ["nal", "Nalik"], ["nam", "Ngan'gityemerri"], ["nan", "Min Nan Chinese"], ["nao", "Naaba"], ["nap", "Neapolitan"], ["naq", "Khoekhoe, Nama (Namibia)"], ["nar", "Iguta"], ["nas", "Naasioi"], ["nat", "Ca̱hungwa̱rya̱, Hungworo"], ["naw", "Nawuri"], ["nax", "Nakwi"], ["nay", "Ngarrindjeri"], ["naz", "Coatepec Nahuatl"], ["nba", "Nyemba"], ["nbb", "Ndoe"], ["nbc", "Chang Naga"], ["nbd", "Ngbinda"], ["nbe", "Konyak Naga"], ["nbf", "Naxi"], ["nbg", "Nagarchal"], ["nbh", "Ngamo"], ["nbi", "Mao Naga"], ["nbj", "Ngarinyman"], ["nbk", "Nake"], ["nbm", "Ngbaka Ma'bo"], ["nbn", "Kuri"], ["nbo", "Nkukoli"], ["nbp", "Nnam"], ["nbq", "Nggem"], ["nbr", "Numana"], ["nbs", "Namibian Sign Language"], ["nbt", "Na"], ["nbu", "Rongmei Naga"], ["nbv", "Ngamambo"], ["nbw", "Southern Ngbandi"], ["nbx", "Ngura"], ["nby", "Ningera"], ["nca", "Iyo"], ["ncb", "Central Nicobarese"], ["ncc", "Ponam"], ["ncd", "Nachering"], ["nce", "Yale"], ["ncf", "Notsi"], ["ncg", "Nisga'a"], ["nch", "Central Huasteca Nahuatl"], ["nci", "Classical Nahuatl"], ["ncj", "Northern Puebla Nahuatl"], ["nck", "Na-kara"], ["ncl", "Michoacán Nahuatl"], ["ncm", "Nambo"], ["ncn", "Nauna"], ["nco", "Sibe"], ["ncp", "Ndaktup"], ["ncq", "Northern Katang"], ["ncr", "Ncane"], ["ncs", "Nicaraguan Sign Language"], ["nct", "Chothe Naga"], ["ncu", "Chumburung"], ["ncx", "Central Puebla Nahuatl"], ["ncz", "Natchez"], ["nda", "Ndasa"], ["ndb", "Kenswei Nsei"], ["ndc", "Ndau"], ["ndd", "Nde-Nsele-Nta"], ["ndf", "Nadruvian"], ["ndg", "Ndengereko"], ["ndh", "Ndali"], ["ndi", "Samba Leko"], ["ndj", "Ndamba"], ["ndk", "Ndaka"], ["ndl", "Ndolo"], ["ndm", "Ndam"], ["ndn", "Ngundi"], ["ndp", "Ndo"], ["ndq", "Ndombe"], ["ndr", "Ndoola"], ["nds", "Low German, Low Saxon"], ["ndt", "Ndunga"], ["ndu", "Dugun"], ["ndv", "Ndut"], ["ndw", "Ndobo"], ["ndx", "Nduga"], ["ndy", "Lutos"], ["ndz", "Ndogo"], ["nea", "Eastern Ngad'a"], ["neb", "Toura (Côte d'Ivoire)"], ["nec", "Nedebang"], ["ned", "Nde-Gbite"], ["nee", "Nêlêmwa-Nixumwak"], ["nef", "Nefamese"], ["neg", "Negidal"], ["neh", "Nyenkha"], ["nei", "Neo-Hittite"], ["nej", "Neko"], ["nek", "Neku"], ["nem", "Nemi"], ["nen", "Nengone"], ["neo", "Ná-Meo"], ["neq", "North Central Mixe"], ["ner", "Yahadian"], ["nes", "Bhoti Kinnauri"], ["net", "Nete"], ["neu", "Neo"], ["nev", "Nyaheun"], ["new", "Newari, Nepal Bhasa"], ["nex", "Neme"], ["ney", "Neyo"], ["nez", "Nez Perce"], ["nfa", "Dhao"], ["nfd", "Ahwai"], ["nfl", "Ayiwo, Äiwoo"], ["nfr", "Nafaanra"], ["nfu", "Mfumte"], ["nga", "Ngbaka"], ["ngb", "Northern Ngbandi"], ["ngc", "Ngombe (Democratic Republic of Congo)"], ["ngd", "Ngando (Central African Republic)"], ["nge", "Ngemba"], ["ngf", "Trans-New Guinea languages"], ["ngg", "Ngbaka Manza"], ["ngh", "Nǁng"], ["ngi", "Ngizim"], ["ngj", "Ngie"], ["ngk", "Dalabon"], ["ngl", "Lomwe"], ["ngm", "Ngatik Men's Creole"], ["ngn", "Ngwo"], ["ngo", "Ngoni"], ["ngp", "Ngulu"], ["ngq", "Ngurimi, Ngoreme"], ["ngr", "Engdewu"], ["ngs", "Gvoko"], ["ngt", "Kriang, Ngeq"], ["ngu", "Guerrero Nahuatl"], ["ngv", "Nagumi"], ["ngw", "Ngwaba"], ["ngx", "Nggwahyi"], ["ngy", "Tibea"], ["ngz", "Ngungwel"], ["nha", "Nhanda"], ["nhb", "Beng"], ["nhc", "Tabasco Nahuatl"], ["nhd", "Chiripá, Ava Guaraní"], ["nhe", "Eastern Huasteca Nahuatl"], ["nhf", "Nhuwala"], ["nhg", "Tetelcingo Nahuatl"], ["nhh", "Nahari"], ["nhi", "Zacatlán-Ahuacatlán-Tepetzintla Nahuatl"], ["nhk", "Isthmus-Cosoleacaque Nahuatl"], ["nhm", "Morelos Nahuatl"], ["nhn", "Central Nahuatl"], ["nho", "Takuu"], ["nhp", "Isthmus-Pajapan Nahuatl"], ["nhq", "Huaxcaleca Nahuatl"], ["nhr", "Naro"], ["nht", "Ometepec Nahuatl"], ["nhu", "Noone"], ["nhv", "Temascaltepec Nahuatl"], ["nhw", "Western Huasteca Nahuatl"], ["nhx", "Isthmus-Mecayapan Nahuatl"], ["nhy", "Northern Oaxaca Nahuatl"], ["nhz", "Santa María La Alta Nahuatl"], ["nia", "Nias"], ["nib", "Nakame"], ["nic", "Niger-Kordofanian languages"], ["nid", "Ngandi"], ["nie", "Niellim"], ["nif", "Nek"], ["nig", "Ngalakgan"], ["nih", "Nyiha (Tanzania)"], ["nii", "Nii"], ["nij", "Ngaju"], ["nik", "Southern Nicobarese"], ["nil", "Nila"], ["nim", "Nilamba"], ["nin", "Ninzo"], ["nio", "Nganasan"], ["niq", "Nandi"], ["nir", "Nimboran"], ["nis", "Nimi"], ["nit", "Southeastern Kolami"], ["niu", "Niuean"], ["niv", "Gilyak"], ["niw", "Nimo"], ["nix", "Hema"], ["niy", "Ngiti"], ["niz", "Ningil"], ["nja", "Nzanyi"], ["njb", "Nocte Naga"], ["njd", "Ndonde Hamba"], ["njh", "Lotha Naga"], ["nji", "Gudanji"], ["njj", "Njen"], ["njl", "Njalgulgule"], ["njm", "Angami Naga"], ["njn", "Liangmai Naga"], ["njo", "Ao Naga"], ["njr", "Njerep"], ["njs", "Nisa"], ["njt", "Ndyuka-Trio Pidgin"], ["nju", "Ngadjunmaya"], ["njx", "Kunyi"], ["njy", "Njyem"], ["njz", "Nyishi"], ["nka", "Nkoya"], ["nkb", "Khoibu Naga"], ["nkc", "Nkongho"], ["nkd", "Koireng"], ["nke", "Duke"], ["nkf", "Inpui Naga"], ["nkg", "Nekgini"], ["nkh", "Khezha Naga"], ["nki", "Thangal Naga"], ["nkj", "Nakai"], ["nkk", "Nokuku"], ["nkm", "Namat"], ["nkn", "Nkangala"], ["nko", "Nkonya"], ["nkp", "Niuatoputapu"], ["nkq", "Nkami"], ["nkr", "Nukuoro"], ["nks", "North Asmat"], ["nkt", "Nyika (Tanzania)"], ["nku", "Bouna Kulango"], ["nkv", "Nyika (Malawi and Zambia)"], ["nkw", "Nkutu"], ["nkx", "Nkoroo"], ["nkz", "Nkari"], ["nla", "Ngombale"], ["nlc", "Nalca"], ["nle", "East Nyala"], ["nlg", "Gela"], ["nli", "Grangali"], ["nlj", "Nyali"], ["nlk", "Ninia Yali"], ["nll", "Nihali"], ["nlm", "Mankiyali"], ["nln", "Durango Nahuatl"], ["nlo", "Ngul"], ["nlq", "Lao Naga"], ["nlr", "Ngarla"], ["nlu", "Nchumbulu"], ["nlv", "Orizaba Nahuatl"], ["nlw", "Walangama"], ["nlx", "Nahali"], ["nly", "Nyamal"], ["nlz", "Nalögo"], ["nma", "Maram Naga"], ["nmb", "Big Nambas, V'ënen Taut"], ["nmc", "Ngam"], ["nmd", "Ndumu"], ["nme", "Mzieme Naga"], ["nmf", "Tangkhul Naga (India)"], ["nmg", "Kwasio"], ["nmh", "Monsang Naga"], ["nmi", "Nyam"], ["nmj", "Ngombe (Central African Republic)"], ["nmk", "Namakura"], ["nml", "Ndemli"], ["nmm", "Manangba"], ["nmn", "ǃXóõ"], ["nmo", "Moyon Naga"], ["nmp", "Nimanbur"], ["nmq", "Nambya"], ["nmr", "Nimbari"], ["nms", "Letemboi"], ["nmt", "Namonuito"], ["nmu", "Northeast Maidu"], ["nmv", "Ngamini"], ["nmw", "Nimoa, Rifao"], ["nmx", "Nama (Papua New Guinea)"], ["nmy", "Namuyi"], ["nmz", "Nawdm"], ["nna", "Nyangumarta"], ["nnb", "Nande"], ["nnc", "Nancere"], ["nnd", "West Ambae"], ["nne", "Ngandyera"], ["nnf", "Ngaing"], ["nng", "Maring Naga"], ["nnh", "Ngiemboon"], ["nni", "North Nuaulu"], ["nnj", "Nyangatom"], ["nnk", "Nankina"], ["nnl", "Northern Rengma Naga"], ["nnm", "Namia"], ["nnn", "Ngete"], ["nnp", "Wancho Naga"], ["nnq", "Ngindo"], ["nnr", "Narungga"], ["nns", "Ningye"], ["nnt", "Nanticoke"], ["nnu", "Dwang"], ["nnv", "Nugunu (Australia)"], ["nnw", "Southern Nuni"], ["nnx", "Ngong"], ["nny", "Nyangga"], ["nnz", "Nda'nda'"], ["noa", "Woun Meu"], ["noc", "Nuk"], ["nod", "Northern Thai"], ["noe", "Nimadi"], ["nof", "Nomane"], ["nog", "Nogai"], ["noh", "Nomu"], ["noi", "Noiri"], ["noj", "Nonuya"], ["nok", "Nooksack"], ["nol", "Nomlaki"], ["nom", "Nocamán"], ["non", "Old Norse"], ["noo", "Nootka"], ["nop", "Numanggang"], ["noq", "Ngongo"], ["nos", "Eastern Nisu"], ["not", "Nomatsiguenga"], ["nou", "Ewage-Notu"], ["nov", "Novial"], ["now", "Nyambo"], ["noy", "Noy"], ["noz", "Nayi"], ["npa", "Nar Phu"], ["npb", "Nupbikha"], ["npg", "Ponyo-Gongwang Naga"], ["nph", "Phom Naga"], ["npi", "Nepali (individual language)"], ["npl", "Southeastern Puebla Nahuatl"], ["npn", "Mondropolon"], ["npo", "Pochuri Naga"], ["nps", "Nipsan"], ["npu", "Puimei Naga"], ["npx", "Noipx"], ["npy", "Napu"], ["nqg", "Southern Nago"], ["nqk", "Kura Ede Nago"], ["nql", "Ngendelengo"], ["nqm", "Ndom"], ["nqn", "Nen"], ["nqo", "N'Ko, N’Ko"], ["nqq", "Kyan-Karyaw Naga"], ["nqt", "Nteng"], ["nqy", "Akyaung Ari Naga"], ["nra", "Ngom"], ["nrb", "Nara"], ["nrc", "Noric"], ["nre", "Southern Rengma Naga"], ["nrf", "Jèrriais, Guernésiais"], ["nrg", "Narango"], ["nri", "Chokri Naga"], ["nrk", "Ngarla"], ["nrl", "Ngarluma"], ["nrm", "Narom"], ["nrn", "Norn"], ["nrp", "North Picene"], ["nrr", "Norra, Nora"], ["nrt", "Northern Kalapuya"], ["nru", "Narua"], ["nrx", "Ngurmbur"], ["nrz", "Lala"], ["nsa", "Sangtam Naga"], ["nsb", "Lower Nossob"], ["nsc", "Nshi"], ["nsd", "Southern Nisu"], ["nse", "Nsenga"], ["nsf", "Northwestern Nisu"], ["nsg", "Ngasa"], ["nsh", "Ngoshie"], ["nsi", "Nigerian Sign Language"], ["nsk", "Naskapi"], ["nsl", "Norwegian Sign Language"], ["nsm", "Sumi Naga"], ["nsn", "Nehan"], ["nso", "Pedi, Northern Sotho, Sepedi"], ["nsp", "Nepalese Sign Language"], ["nsq", "Northern Sierra Miwok"], ["nsr", "Maritime Sign Language"], ["nss", "Nali"], ["nst", "Tase Naga"], ["nsu", "Sierra Negra Nahuatl"], ["nsv", "Southwestern Nisu"], ["nsw", "Navut"], ["nsx", "Nsongo"], ["nsy", "Nasal"], ["nsz", "Nisenan"], ["ntd", "Northern Tidung"], ["nte", "Nathembo"], ["ntg", "Ngantangarra"], ["nti", "Natioro"], ["ntj", "Ngaanyatjarra"], ["ntk", "Ikoma-Nata-Isenye"], ["ntm", "Nateni"], ["nto", "Ntomba"], ["ntp", "Northern Tepehuan"], ["ntr", "Delo"], ["nts", "Natagaimas"], ["ntu", "Natügu"], ["ntw", "Nottoway"], ["ntx", "Tangkhul Naga (Myanmar)"], ["nty", "Mantsi"], ["ntz", "Natanzi"], ["nua", "Yuanga"], ["nub", "Nubian languages"], ["nuc", "Nukuini"], ["nud", "Ngala"], ["nue", "Ngundu"], ["nuf", "Nusu"], ["nug", "Nungali"], ["nuh", "Ndunda"], ["nui", "Ngumbi"], ["nuj", "Nyole"], ["nuk", "Nuu-chah-nulth, Nuuchahnulth"], ["nul", "Nusa Laut"], ["num", "Niuafo'ou"], ["nun", "Anong"], ["nuo", "Nguôn"], ["nup", "Nupe-Nupe-Tako"], ["nuq", "Nukumanu"], ["nur", "Nukuria"], ["nus", "Nuer"], ["nut", "Nung (Viet Nam)"], ["nuu", "Ngbundu"], ["nuv", "Northern Nuni"], ["nuw", "Nguluwan"], ["nux", "Mehek"], ["nuy", "Nunggubuyu"], ["nuz", "Tlamacazapa Nahuatl"], ["nvh", "Nasarian"], ["nvm", "Namiae"], ["nvo", "Nyokon"], ["nwa", "Nawathinehena"], ["nwb", "Nyabwa"], ["nwc", "Classical Newari, Classical Nepal Bhasa, Old Newari"], ["nwe", "Ngwe"], ["nwg", "Ngayawung"], ["nwi", "Southwest Tanna"], ["nwm", "Nyamusa-Molo"], ["nwo", "Nauo"], ["nwr", "Nawaru"], ["nwx", "Middle Newar"], ["nwy", "Nottoway-Meherrin"], ["nxa", "Nauete"], ["nxd", "Ngando (Democratic Republic of Congo)"], ["nxe", "Nage"], ["nxg", "Ngad'a"], ["nxi", "Nindi"], ["nxk", "Koki Naga"], ["nxl", "South Nuaulu"], ["nxm", "Numidian"], ["nxn", "Ngawun"], ["nxo", "Ndambomo"], ["nxq", "Naxi"], ["nxr", "Ninggerum"], ["nxu", "Narau"], ["nxx", "Nafri"], ["nyb", "Nyangbo"], ["nyc", "Nyanga-li"], ["nyd", "Nyore, Olunyole"], ["nye", "Nyengo"], ["nyf", "Giryama, Kigiryama"], ["nyg", "Nyindu"], ["nyh", "Nyikina"], ["nyi", "Ama (Sudan)"], ["nyj", "Nyanga"], ["nyk", "Nyaneka"], ["nyl", "Nyeu"], ["nym", "Nyamwezi"], ["nyn", "Nyankole"], ["nyo", "Nyoro"], ["nyp", "Nyang'i"], ["nyq", "Nayini"], ["nyr", "Nyiha (Malawi)"], ["nys", "Nyungar"], ["nyt", "Nyawaygi"], ["nyu", "Nyungwe"], ["nyv", "Nyulnyul"], ["nyw", "Nyaw"], ["nyx", "Nganyaywana"], ["nyy", "Nyakyusa-Ngonde"], ["nza", "Tigon Mbembe"], ["nzb", "Njebi"], ["nzd", "Nzadi"], ["nzi", "Nzima"], ["nzk", "Nzakara"], ["nzm", "Zeme Naga"], ["nzs", "New Zealand Sign Language"], ["nzu", "Teke-Nzikou"], ["nzy", "Nzakambay"], ["nzz", "Nanga Dama Dogon"], ["oaa", "Orok"], ["oac", "Oroch"], ["oar", "Old Aramaic (up to 700 BCE), Ancient Aramaic (up to 700 BCE)"], ["oav", "Old Avar"], ["obi", "Obispeño"], ["obk", "Southern Bontok"], ["obl", "Oblo"], ["obm", "Moabite"], ["obo", "Obo Manobo"], ["obr", "Old Burmese"], ["obt", "Old Breton"], ["obu", "Obulom"], ["oca", "Ocaina"], ["och", "Old Chinese"], ["ocm", "Old Cham"], ["oco", "Old Cornish"], ["ocu", "Atzingo Matlatzinca"], ["oda", "Odut"], ["odk", "Od"], ["odt", "Old Dutch"], ["odu", "Odual"], ["ofo", "Ofo"], ["ofs", "Old Frisian"], ["ofu", "Efutop"], ["ogb", "Ogbia"], ["ogc", "Ogbah"], ["oge", "Old Georgian"], ["ogg", "Ogbogolo"], ["ogo", "Khana"], ["ogu", "Ogbronuagum"], ["oht", "Old Hittite"], ["ohu", "Old Hungarian"], ["oia", "Oirata"], ["oin", "Inebu One"], ["ojb", "Northwestern Ojibwa"], ["ojc", "Central Ojibwa"], ["ojg", "Eastern Ojibwa"], ["ojp", "Old Japanese"], ["ojs", "Severn Ojibwa"], ["ojv", "Ontong Java"], ["ojw", "Western Ojibwa"], ["oka", "Okanagan"], ["okb", "Okobo"], ["okc", "Kobo"], ["okd", "Okodia"], ["oke", "Okpe (Southwestern Edo)"], ["okg", "Koko Babangk"], ["okh", "Koresh-e Rostam"], ["oki", "Okiek"], ["okj", "Oko-Juwoi"], ["okk", "Kwamtim One"], ["okl", "Old Kentish Sign Language"], ["okm", "Middle Korean (10th-16th cent.)"], ["okn", "Oki-No-Erabu"], ["oko", "Old Korean (3rd-9th cent.)"], ["okr", "Kirike"], ["oks", "Oko-Eni-Osayen"], ["oku", "Oku"], ["okv", "Orokaiva"], ["okx", "Okpe (Northwestern Edo)"], ["okz", "Old Khmer"], ["ola", "Walungge"], ["old", "Mochi"], ["ole", "Olekha"], ["olk", "Olkol"], ["olm", "Oloma"], ["olo", "Livvi"], ["olr", "Olrat"], ["olt", "Old Lithuanian"], ["olu", "Kuvale"], ["oma", "Omaha-Ponca"], ["omb", "East Ambae"], ["omc", "Mochica"], ["ome", "Omejes"], ["omg", "Omagua"], ["omi", "Omi"], ["omk", "Omok"], ["oml", "Ombo"], ["omn", "Minoan"], ["omo", "Utarmbung"], ["omp", "Old Manipuri"], ["omq", "Oto-Manguean languages"], ["omr", "Old Marathi"], ["omt", "Omotik"], ["omu", "Omurano"], ["omv", "Omotic languages"], ["omw", "South Tairora"], ["omx", "Old Mon"], ["omy", "Old Malay"], ["ona", "Ona"], ["onb", "Lingao"], ["one", "Oneida"], ["ong", "Olo"], ["oni", "Onin"], ["onj", "Onjob"], ["onk", "Kabore One"], ["onn", "Onobasulu"], ["ono", "Onondaga"], ["onp", "Sartang"], ["onr", "Northern One"], ["ons", "Ono"], ["ont", "Ontenu"], ["onu", "Unua"], ["onw", "Old Nubian"], ["onx", "Onin Based Pidgin"], ["ood", "Tohono O'odham"], ["oog", "Ong"], ["oon", "Önge"], ["oor", "Oorlams"], ["oos", "Old Ossetic"], ["opa", "Okpamheri"], ["opk", "Kopkaka"], ["opm", "Oksapmin"], ["opo", "Opao"], ["opt", "Opata"], ["opy", "Ofayé"], ["ora", "Oroha"], ["orc", "Orma"], ["ore", "Orejón"], ["org", "Oring"], ["orh", "Oroqen"], ["orn", "Orang Kanaq"], ["oro", "Orokolo"], ["orr", "Oruma"], ["ors", "Orang Seletar"], ["ort", "Adivasi Oriya"], ["oru", "Ormuri"], ["orv", "Old Russian"], ["orw", "Oro Win"], ["orx", "Oro"], ["ory", "Odia (individual language), Oriya (individual language)"], ["orz", "Ormu"], ["osa", "Osage"], ["osc", "Oscan"], ["osi", "Osing"], ["osn", "Old Sundanese"], ["oso", "Ososo"], ["osp", "Old Spanish"], ["ost", "Osatu"], ["osu", "Southern One"], ["osx", "Old Saxon"], ["ota", "Ottoman Turkish (1500-1928)"], ["otb", "Old Tibetan"], ["otd", "Ot Danum"], ["ote", "Mezquital Otomi"], ["oti", "Oti"], ["otk", "Old Turkish"], ["otl", "Tilapa Otomi"], ["otm", "Eastern Highland Otomi"], ["otn", "Tenango Otomi"], ["oto", "Otomian languages"], ["otq", "Querétaro Otomi"], ["otr", "Otoro"], ["ots", "Estado de México Otomi"], ["ott", "Temoaya Otomi"], ["otu", "Otuke"], ["otw", "Ottawa"], ["otx", "Texcatepec Otomi"], ["oty", "Old Tamil"], ["otz", "Ixtenco Otomi"], ["oua", "Tagargrent"], ["oub", "Glio-Oubi"], ["oue", "Oune"], ["oui", "Old Uighur"], ["oum", "Ouma"], ["oun", "ǃOǃung"], ["ovd", "Elfdalian, Övdalian"], ["owi", "Owiniga"], ["owl", "Old Welsh"], ["oyb", "Oy"], ["oyd", "Oyda"], ["oym", "Wayampi"], ["oyy", "Oya'oya"], ["ozm", "Koonzime"], ["paa", "Papuan languages"], ["pab", "Parecís"], ["pac", "Pacoh"], ["pad", "Paumarí"], ["pae", "Pagibete"], ["paf", "Paranawát"], ["pag", "Pangasinan"], ["pah", "Tenharim"], ["pai", "Pe"], ["pak", "Parakanã"], ["pal", "Pahlavi"], ["pam", "Pampanga, Kapampangan"], ["pao", "Northern Paiute"], ["pap", "Papiamento"], ["paq", "Parya"], ["par", "Panamint, Timbisha"], ["pas", "Papasena"], ["pat", "Papitalai"], ["pau", "Palauan"], ["pav", "Pakaásnovos"], ["paw", "Pawnee"], ["pax", "Pankararé"], ["pay", "Pech"], ["paz", "Pankararú"], ["pbb", "Páez"], ["pbc", "Patamona"], ["pbe", "Mezontla Popoloca"], ["pbf", "Coyotepec Popoloca"], ["pbg", "Paraujano"], ["pbh", "E'ñapa Woromaipu"], ["pbi", "Parkwa"], ["pbl", "Mak (Nigeria)"], ["pbm", "Puebla Mazatec"], ["pbn", "Kpasam"], ["pbo", "Papel"], ["pbp", "Badyara"], ["pbr", "Pangwa"], ["pbs", "Central Pame"], ["pbt", "Southern Pashto"], ["pbu", "Northern Pashto"], ["pbv", "Pnar"], ["pby", "Pyu (Papua New Guinea)"], ["pbz", "Palu"], ["pca", "Santa Inés Ahuatempan Popoloca"], ["pcb", "Pear"], ["pcc", "Bouyei"], ["pcd", "Picard"], ["pce", "Ruching Palaung"], ["pcf", "Paliyan"], ["pcg", "Paniya"], ["pch", "Pardhan"], ["pci", "Duruwa"], ["pcj", "Parenga"], ["pck", "Paite Chin"], ["pcl", "Pardhi"], ["pcm", "Nigerian Pidgin"], ["pcn", "Piti"], ["pcp", "Pacahuara"], ["pcr", "Panang"], ["pcw", "Pyapun"], ["pda", "Anam"], ["pdc", "Pennsylvania German"], ["pdi", "Pa Di"], ["pdn", "Podena, Fedan"], ["pdo", "Padoe"], ["pdt", "Plautdietsch"], ["pdu", "Kayan"], ["pea", "Peranakan Indonesian"], ["peb", "Eastern Pomo"], ["ped", "Mala (Papua New Guinea)"], ["pee", "Taje"], ["pef", "Northeastern Pomo"], ["peg", "Pengo"], ["peh", "Bonan"], ["pei", "Chichimeca-Jonaz"], ["pej", "Northern Pomo"], ["pek", "Penchal"], ["pel", "Pekal"], ["pem", "Phende"], ["peo", "Old Persian (ca. 600-400 B.C.)"], ["pep", "Kunja"], ["peq", "Southern Pomo"], ["pes", "Iranian Persian"], ["pev", "Pémono"], ["pex", "Petats"], ["pey", "Petjo"], ["pez", "Eastern Penan"], ["pfa", "Pááfang"], ["pfe", "Pere"], ["pfl", "Pfaelzisch"], ["pga", "Sudanese Creole Arabic"], ["pgd", "Gāndhārī"], ["pgg", "Pangwali"], ["pgi", "Pagi"], ["pgk", "Rerep"], ["pgl", "Primitive Irish"], ["pgn", "Paelignian"], ["pgs", "Pangseng"], ["pgu", "Pagu"], ["pgy", "Pongyong"], ["pgz", "Papua New Guinean Sign Language"], ["pha", "Pa-Hng"], ["phd", "Phudagi"], ["phg", "Phuong"], ["phh", "Phukha"], ["phi", "Philippine languages"], ["phk", "Phake"], ["phl", "Phalura, Palula"], ["phm", "Phimbi"], ["phn", "Phoenician"], ["pho", "Phunoi"], ["phq", "Phana'"], ["phr", "Pahari-Potwari"], ["pht", "Phu Thai"], ["phu", "Phuan"], ["phv", "Pahlavani"], ["phw", "Phangduwali"], ["pia", "Pima Bajo"], ["pib", "Yine"], ["pic", "Pinji"], ["pid", "Piaroa"], ["pie", "Piro"], ["pif", "Pingelapese"], ["pig", "Pisabo"], ["pih", "Pitcairn-Norfolk"], ["pii", "Pini"], ["pij", "Pijao"], ["pil", "Yom"], ["pim", "Powhatan"], ["pin", "Piame"], ["pio", "Piapoco"], ["pip", "Pero"], ["pir", "Piratapuyo"], ["pis", "Pijin"], ["pit", "Pitta Pitta"], ["piu", "Pintupi-Luritja"], ["piv", "Pileni, Vaeakau-Taumako"], ["piw", "Pimbwe"], ["pix", "Piu"], ["piy", "Piya-Kwonci"], ["piz", "Pije"], ["pjt", "Pitjantjatjara"], ["pka", "Ardhamāgadhī Prākrit"], ["pkb", "Pokomo, Kipfokomo"], ["pkc", "Paekche"], ["pkg", "Pak-Tong"], ["pkh", "Pankhu"], ["pkn", "Pakanha"], ["pko", "Pökoot"], ["pkp", "Pukapuka"], ["pkr", "Attapady Kurumba"], ["pks", "Pakistan Sign Language"], ["pkt", "Maleng"], ["pku", "Paku"], ["pla", "Miani"], ["plb", "Polonombauk"], ["plc", "Central Palawano"], ["pld", "Polari"], ["ple", "Palu'e"], ["plf", "Central Malayo-Polynesian languages"], ["plg", "Pilagá"], ["plh", "Paulohi"], ["plj", "Polci"], ["plk", "Kohistani Shina"], ["pll", "Shwe Palaung"], ["pln", "Palenquero"], ["plo", "Oluta Popoluca"], ["plp", "Palpa"], ["plq", "Palaic"], ["plr", "Palaka Senoufo"], ["pls", "San Marcos Tlacoyalco Popoloca, San Marcos Tlalcoyalco Popoloca"], ["plt", "Plateau Malagasy"], ["plu", "Palikúr"], ["plv", "Southwest Palawano"], ["plw", "Brooke's Point Palawano"], ["ply", "Bolyu"], ["plz", "Paluan"], ["pma", "Paama"], ["pmb", "Pambia"], ["pmc", "Palumata"], ["pmd", "Pallanganmiddang"], ["pme", "Pwaamei"], ["pmf", "Pamona"], ["pmh", "Māhārāṣṭri Prākrit"], ["pmi", "Northern Pumi"], ["pmj", "Southern Pumi"], ["pmk", "Pamlico"], ["pml", "Lingua Franca"], ["pmm", "Pomo"], ["pmn", "Pam"], ["pmo", "Pom"], ["pmq", "Northern Pame"], ["pmr", "Paynamar"], ["pms", "Piemontese"], ["pmt", "Tuamotuan"], ["pmu", "Mirpur Panjabi"], ["pmw", "Plains Miwok"], ["pmx", "Poumei Naga"], ["pmy", "Papuan Malay"], ["pmz", "Southern Pame"], ["pna", "Punan Bah-Biau"], ["pnb", "Western Panjabi"], ["pnc", "Pannei"], ["pnd", "Mpinda"], ["pne", "Western Penan"], ["png", "Pangu, Pongu"], ["pnh", "Penrhyn"], ["pni", "Aoheng"], ["pnj", "Pinjarup"], ["pnk", "Paunaka"], ["pnl", "Paleni"], ["pnm", "Punan Batu 1"], ["pnn", "Pinai-Hagahai"], ["pno", "Panobo"], ["pnp", "Pancana"], ["pnq", "Pana (Burkina Faso)"], ["pnr", "Panim"], ["pns", "Ponosakan"], ["pnt", "Pontic"], ["pnu", "Jiongnai Bunu"], ["pnv", "Pinigura"], ["pnw", "Banyjima, Panytyima"], ["pnx", "Phong-Kniang"], ["pny", "Pinyin"], ["pnz", "Pana (Central African Republic)"], ["poc", "Poqomam"], ["pod", "Ponares"], ["poe", "San Juan Atzingo Popoloca"], ["pof", "Poke"], ["pog", "Potiguára"], ["poh", "Poqomchi'"], ["poi", "Highland Popoluca"], ["pok", "Pokangá"], ["pom", "Southeastern Pomo"], ["pon", "Pohnpeian"], ["poo", "Central Pomo"], ["pop", "Pwapwâ"], ["poq", "Texistepec Popoluca"], ["pos", "Sayula Popoluca"], ["pot", "Potawatomi"], ["pov", "Upper Guinea Crioulo"], ["pow", "San Felipe Otlaltepec Popoloca"], ["pox", "Polabian"], ["poy", "Pogolo"], ["poz", "Malayo-Polynesian languages"], ["ppa", "Pao"], ["ppe", "Papi"], ["ppi", "Paipai"], ["ppk", "Uma"], ["ppl", "Pipil, Nicarao"], ["ppm", "Papuma"], ["ppn", "Papapana"], ["ppo", "Folopa"], ["ppp", "Pelende"], ["ppq", "Pei"], ["ppr", "Piru"], ["pps", "San Luís Temalacayuca Popoloca"], ["ppt", "Pare"], ["ppu", "Papora"], ["pqa", "Pa'a"], ["pqe", "Eastern Malayo-Polynesian languages"], ["pqm", "Malecite-Passamaquoddy"], ["pqw", "Western Malayo-Polynesian languages"], ["pra", "Prakrit languages"], ["prb", "Lua'"], ["prc", "Parachi"], ["prd", "Parsi-Dari"], ["pre", "Principense"], ["prf", "Paranan"], ["prg", "Prussian"], ["prh", "Porohanon"], ["pri", "Paicî"], ["prk", "Parauk"], ["prl", "Peruvian Sign Language"], ["prm", "Kibiri"], ["prn", "Prasuni"], ["pro", "Old Provençal (to 1500), Old Occitan (to 1500)"], ["prp", "Parsi"], ["prq", "Ashéninka Perené"], ["prr", "Puri"], ["prs", "Dari, Afghan Persian"], ["prt", "Phai"], ["pru", "Puragi"], ["prw", "Parawen"], ["prx", "Purik"], ["pry", "Pray 3"], ["prz", "Providencia Sign Language"], ["psa", "Asue Awyu"], ["psc", "Persian Sign Language"], ["psd", "Plains Indian Sign Language"], ["pse", "Central Malay"], ["psg", "Penang Sign Language"], ["psh", "Southwest Pashai, Southwest Pashayi"], ["psi", "Southeast Pashai, Southeast Pashayi"], ["psl", "Puerto Rican Sign Language"], ["psm", "Pauserna"], ["psn", "Panasuan"], ["pso", "Polish Sign Language"], ["psp", "Philippine Sign Language"], ["psq", "Pasi"], ["psr", "Portuguese Sign Language"], ["pss", "Kaulong"], ["pst", "Central Pashto"], ["psu", "Sauraseni Prākrit"], ["psw", "Port Sandwich"], ["psy", "Piscataway"], ["pta", "Pai Tavytera"], ["pth", "Pataxó Hã-Ha-Hãe"], ["pti", "Pindiini, Wangkatha"], ["ptn", "Patani"], ["pto", "Zo'é"], ["ptp", "Patep"], ["ptq", "Pattapu"], ["ptr", "Piamatsina"], ["ptt", "Enrekang"], ["ptu", "Bambam"], ["ptv", "Port Vato"], ["ptw", "Pentlatch"], ["pty", "Pathiya"], ["pua", "Western Highland Purepecha"], ["pub", "Purum"], ["puc", "Punan Merap"], ["pud", "Punan Aput"], ["pue", "Puelche"], ["puf", "Punan Merah"], ["pug", "Phuie"], ["pui", "Puinave"], ["puj", "Punan Tubu"], ["puk", "Pu Ko"], ["pum", "Puma"], ["puo", "Puoc"], ["pup", "Pulabu"], ["puq", "Puquina"], ["pur", "Puruborá"], ["put", "Putoh"], ["puu", "Punu"], ["puw", "Puluwatese"], ["pux", "Puare"], ["puy", "Purisimeño"], ["puz", "Purum Naga"], ["pwa", "Pawaia"], ["pwb", "Panawa"], ["pwg", "Gapapaiwa"], ["pwi", "Patwin"], ["pwm", "Molbog"], ["pwn", "Paiwan"], ["pwo", "Pwo Western Karen"], ["pwr", "Powari"], ["pww", "Pwo Northern Karen"], ["pxm", "Quetzaltepec Mixe"], ["pye", "Pye Krumen"], ["pym", "Fyam"], ["pyn", "Poyanáwa"], ["pys", "Paraguayan Sign Language, Lengua de Señas del Paraguay"], ["pyu", "Puyuma"], ["pyx", "Pyu (Myanmar)"], ["pyy", "Pyen"], ["pzn", "Para Naga"], ["qaa..qtz", "Private use"], ["qua", "Quapaw"], ["qub", "Huallaga Huánuco Quechua"], ["quc", "K'iche', Quiché"], ["qud", "Calderón Highland Quichua"], ["quf", "Lambayeque Quechua"], ["qug", "Chimborazo Highland Quichua"], ["quh", "South Bolivian Quechua"], ["qui", "Quileute"], ["quk", "Chachapoyas Quechua"], ["qul", "North Bolivian Quechua"], ["qum", "Sipacapense"], ["qun", "Quinault"], ["qup", "Southern Pastaza Quechua"], ["quq", "Quinqui"], ["qur", "Yanahuanca Pasco Quechua"], ["qus", "Santiago del Estero Quichua"], ["quv", "Sacapulteco"], ["quw", "Tena Lowland Quichua"], ["qux", "Yauyos Quechua"], ["quy", "Ayacucho Quechua"], ["quz", "Cusco Quechua"], ["qva", "Ambo-Pasco Quechua"], ["qvc", "Cajamarca Quechua"], ["qve", "Eastern Apurímac Quechua"], ["qvh", "Huamalíes-Dos de Mayo Huánuco Quechua"], ["qvi", "Imbabura Highland Quichua"], ["qvj", "Loja Highland Quichua"], ["qvl", "Cajatambo North Lima Quechua"], ["qvm", "Margos-Yarowilca-Lauricocha Quechua"], ["qvn", "North Junín Quechua"], ["qvo", "Napo Lowland Quechua"], ["qvp", "Pacaraos Quechua"], ["qvs", "San Martín Quechua"], ["qvw", "Huaylla Wanca Quechua"], ["qvy", "Queyu"], ["qvz", "Northern Pastaza Quichua"], ["qwa", "Corongo Ancash Quechua"], ["qwc", "Classical Quechua"], ["qwe", "Quechuan (family)"], ["qwh", "Huaylas Ancash Quechua"], ["qwm", "Kuman (Russia)"], ["qws", "Sihuas Ancash Quechua"], ["qwt", "Kwalhioqua-Tlatskanai"], ["qxa", "Chiquián Ancash Quechua"], ["qxc", "Chincha Quechua"], ["qxh", "Panao Huánuco Quechua"], ["qxl", "Salasaca Highland Quichua"], ["qxn", "Northern Conchucos Ancash Quechua"], ["qxo", "Southern Conchucos Ancash Quechua"], ["qxp", "Puno Quechua"], ["qxq", "Qashqa'i"], ["qxr", "Cañar Highland Quichua"], ["qxs", "Southern Qiang"], ["qxt", "Santa Ana de Tusi Pasco Quechua"], ["qxu", "Arequipa-La Unión Quechua"], ["qxw", "Jauja Wanca Quechua"], ["qya", "Quenya"], ["qyp", "Quiripi"], ["raa", "Dungmali"], ["rab", "Camling"], ["rac", "Rasawa"], ["rad", "Rade"], ["raf", "Western Meohang"], ["rag", "Logooli, Lulogooli"], ["rah", "Rabha"], ["rai", "Ramoaaina"], ["raj", "Rajasthani"], ["rak", "Tulu-Bohuai"], ["ral", "Ralte"], ["ram", "Canela"], ["ran", "Riantana"], ["rao", "Rao"], ["rap", "Rapanui"], ["raq", "Saam"], ["rar", "Rarotongan, Cook Islands Maori"], ["ras", "Tegali"], ["rat", "Razajerdi"], ["rau", "Raute"], ["rav", "Sampang"], ["raw", "Rawang"], ["rax", "Rang"], ["ray", "Rapa"], ["raz", "Rahambuu"], ["rbb", "Rumai Palaung"], ["rbk", "Northern Bontok"], ["rbl", "Miraya Bikol"], ["rbp", "Barababaraba"], ["rcf", "Réunion Creole French"], ["rdb", "Rudbari"], ["rea", "Rerau"], ["reb", "Rembong"], ["ree", "Rejang Kayan"], ["reg", "Kara (Tanzania)"], ["rei", "Reli"], ["rej", "Rejang"], ["rel", "Rendille"], ["rem", "Remo"], ["ren", "Rengao"], ["rer", "Rer Bare"], ["res", "Reshe"], ["ret", "Retta"], ["rey", "Reyesano"], ["rga", "Roria"], ["rge", "Romano-Greek"], ["rgk", "Rangkas"], ["rgn", "Romagnol"], ["rgr", "Resígaro"], ["rgs", "Southern Roglai"], ["rgu", "Ringgou"], ["rhg", "Rohingya"], ["rhp", "Yahang"], ["ria", "Riang (India)"], ["rie", "Rien"], ["rif", "Tarifit"], ["ril", "Riang Lang, Riang (Myanmar)"], ["rim", "Nyaturu"], ["rin", "Nungu"], ["rir", "Ribun"], ["rit", "Ritharrngu"], ["riu", "Riung"], ["rjg", "Rajong"], ["rji", "Raji"], ["rjs", "Rajbanshi"], ["rka", "Kraol"], ["rkb", "Rikbaktsa"], ["rkh", "Rakahanga-Manihiki"], ["rki", "Rakhine"], ["rkm", "Marka"], ["rkt", "Rangpuri, Kamta"], ["rkw", "Arakwal"], ["rma", "Rama"], ["rmb", "Rembarrnga"], ["rmc", "Carpathian Romani"], ["rmd", "Traveller Danish"], ["rme", "Angloromani"], ["rmf", "Kalo Finnish Romani"], ["rmg", "Traveller Norwegian"], ["rmh", "Murkim"], ["rmi", "Lomavren"], ["rmk", "Romkun"], ["rml", "Baltic Romani"], ["rmm", "Roma"], ["rmn", "Balkan Romani"], ["rmo", "Sinte Romani"], ["rmp", "Rempi"], ["rmq", "Caló"], ["rmr", "Caló"], ["rms", "Romanian Sign Language"], ["rmt", "Domari"], ["rmu", "Tavringer Romani"], ["rmv", "Romanova"], ["rmw", "Welsh Romani"], ["rmx", "Romam"], ["rmy", "Vlax Romani"], ["rmz", "Marma"], ["rna", "Runa"], ["rnd", "Ruund"], ["rng", "Ronga"], ["rnl", "Ranglong"], ["rnn", "Roon"], ["rnp", "Rongpo"], ["rnr", "Nari Nari"], ["rnw", "Rungwa"], ["roa", "Romance languages"], ["rob", "Tae'"], ["roc", "Cacgia Roglai"], ["rod", "Rogo"], ["roe", "Ronji"], ["rof", "Rombo"], ["rog", "Northern Roglai"], ["rol", "Romblomanon"], ["rom", "Romany"], ["roo", "Rotokas"], ["rop", "Kriol"], ["ror", "Rongga"], ["rou", "Runga"], ["row", "Dela-Oenale"], ["rpn", "Repanbitip"], ["rpt", "Rapting"], ["rri", "Ririo"], ["rro", "Waima"], ["rrt", "Arritinngithigh"], ["rsb", "Romano-Serbian"], ["rsi", "Rennellese Sign Language"], ["rsl", "Russian Sign Language"], ["rsm", "Miriwoong Sign Language"], ["rtc", "Rungtu Chin"], ["rth", "Ratahan"], ["rtm", "Rotuman"], ["rts", "Yurats"], ["rtw", "Rathawi"], ["rub", "Gungu"], ["ruc", "Ruuli"], ["rue", "Rusyn"], ["ruf", "Luguru"], ["rug", "Roviana"], ["ruh", "Ruga"], ["rui", "Rufiji"], ["ruk", "Che"], ["ruo", "Istro Romanian"], ["rup", "Macedo-Romanian, Aromanian, Arumanian"], ["ruq", "Megleno Romanian"], ["rut", "Rutul"], ["ruu", "Lanas Lobu"], ["ruy", "Mala (Nigeria)"], ["ruz", "Ruma"], ["rwa", "Rawo"], ["rwk", "Rwa"], ["rwl", "Ruwila"], ["rwm", "Amba (Uganda)"], ["rwo", "Rawa"], ["rwr", "Marwari (India)"], ["rxd", "Ngardi"], ["rxw", "Karuwali, Garuwali"], ["ryn", "Northern Amami-Oshima"], ["rys", "Yaeyama"], ["ryu", "Central Okinawan"], ["rzh", "Rāziḥī"], ["saa", "Saba"], ["sab", "Buglere"], ["sac", "Meskwaki"], ["sad", "Sandawe"], ["sae", "Sabanê"], ["saf", "Safaliba"], ["sah", "Yakut"], ["sai", "South American Indian languages"], ["saj", "Sahu"], ["sak", "Sake"], ["sal", "Salishan languages"], ["sam", "Samaritan Aramaic"], ["sao", "Sause"], ["sap", "Sanapaná"], ["saq", "Samburu"], ["sar", "Saraveca"], ["sas", "Sasak"], ["sat", "Santali"], ["sau", "Saleman"], ["sav", "Saafi-Saafi"], ["saw", "Sawi"], ["sax", "Sa"], ["say", "Saya"], ["saz", "Saurashtra"], ["sba", "Ngambay"], ["sbb", "Simbo"], ["sbc", "Kele (Papua New Guinea)"], ["sbd", "Southern Samo"], ["sbe", "Saliba"], ["sbf", "Chabu, Shabo"], ["sbg", "Seget"], ["sbh", "Sori-Harengan"], ["sbi", "Seti"], ["sbj", "Surbakhal"], ["sbk", "Safwa"], ["sbl", "Botolan Sambal"], ["sbm", "Sagala"], ["sbn", "Sindhi Bhil"], ["sbo", "Sabüm"], ["sbp", "Sangu (Tanzania)"], ["sbq", "Sileibi"], ["sbr", "Sembakung Murut"], ["sbs", "Subiya"], ["sbt", "Kimki"], ["sbu", "Stod Bhoti"], ["sbv", "Sabine"], ["sbw", "Simba"], ["sbx", "Seberuang"], ["sby", "Soli"], ["sbz", "Sara Kaba"], ["sca", "Sansu"], ["scb", "Chut"], ["sce", "Dongxiang"], ["scf", "San Miguel Creole French"], ["scg", "Sanggau"], ["sch", "Sakachep"], ["sci", "Sri Lankan Creole Malay"], ["sck", "Sadri"], ["scl", "Shina"], ["scn", "Sicilian"], ["sco", "Scots"], ["scp", "Hyolmo, Helambu Sherpa"], ["scq", "Sa'och"], ["scs", "North Slavey"], ["sct", "Southern Katang"], ["scu", "Shumcho"], ["scv", "Sheni"], ["scw", "Sha"], ["scx", "Sicel"], ["sda", "Toraja-Sa'dan"], ["sdb", "Shabak"], ["sdc", "Sassarese Sardinian"], ["sde", "Surubu"], ["sdf", "Sarli"], ["sdg", "Savi"], ["sdh", "Southern Kurdish"], ["sdj", "Suundi"], ["sdk", "Sos Kundi"], ["sdl", "Saudi Arabian Sign Language"], ["sdm", "Semandang"], ["sdn", "Gallurese Sardinian"], ["sdo", "Bukar-Sadung Bidayuh"], ["sdp", "Sherdukpen"], ["sdq", "Semandang"], ["sdr", "Oraon Sadri"], ["sds", "Sened"], ["sdt", "Shuadit"], ["sdu", "Sarudu"], ["sdv", "Eastern Sudanic languages"], ["sdx", "Sibu Melanau"], ["sdz", "Sallands"], ["sea", "Semai"], ["seb", "Shempire Senoufo"], ["sec", "Sechelt"], ["sed", "Sedang"], ["see", "Seneca"], ["sef", "Cebaara Senoufo"], ["seg", "Segeju"], ["seh", "Sena"], ["sei", "Seri"], ["sej", "Sene"], ["sek", "Sekani"], ["sel", "Selkup"], ["sem", "Semitic languages"], ["sen", "Nanerigé Sénoufo"], ["seo", "Suarmin"], ["sep", "Sìcìté Sénoufo"], ["seq", "Senara Sénoufo"], ["ser", "Serrano"], ["ses", "Koyraboro Senni Songhai"], ["set", "Sentani"], ["seu", "Serui-Laut"], ["sev", "Nyarafolo Senoufo"], ["sew", "Sewa Bay"], ["sey", "Secoya"], ["sez", "Senthang Chin"], ["sfb", "Langue des signes de Belgique Francophone, French Belgian Sign Language"], ["sfe", "Eastern Subanen"], ["sfm", "Small Flowery Miao"], ["sfs", "South African Sign Language"], ["sfw", "Sehwi"], ["sga", "Old Irish (to 900)"], ["sgb", "Mag-antsi Ayta"], ["sgc", "Kipsigis"], ["sgd", "Surigaonon"], ["sge", "Segai"], ["sgg", "Swiss-German Sign Language"], ["sgh", "Shughni"], ["sgi", "Suga"], ["sgj", "Surgujia"], ["sgk", "Sangkong"], ["sgl", "Sanglechi-Ishkashimi"], ["sgm", "Singa"], ["sgn", "Sign languages"], ["sgo", "Songa"], ["sgp", "Singpho"], ["sgr", "Sangisari"], ["sgs", "Samogitian"], ["sgt", "Brokpake"], ["sgu", "Salas"], ["sgw", "Sebat Bet Gurage"], ["sgx", "Sierra Leone Sign Language"], ["sgy", "Sanglechi"], ["sgz", "Sursurunga"], ["sha", "Shall-Zwall"], ["shb", "Ninam"], ["shc", "Sonde"], ["shd", "Kundal Shahi"], ["she", "Sheko"], ["shg", "Shua"], ["shh", "Shoshoni"], ["shi", "Tachelhit"], ["shj", "Shatt"], ["shk", "Shilluk"], ["shl", "Shendu"], ["shm", "Shahrudi"], ["shn", "Shan"], ["sho", "Shanga"], ["shp", "Shipibo-Conibo"], ["shq", "Sala"], ["shr", "Shi"], ["shs", "Shuswap"], ["sht", "Shasta"], ["shu", "Chadian Arabic"], ["shv", "Shehri"], ["shw", "Shwai"], ["shx", "She"], ["shy", "Tachawit"], ["shz", "Syenara Senoufo"], ["sia", "Akkala Sami"], ["sib", "Sebop"], ["sid", "Sidamo"], ["sie", "Simaa"], ["sif", "Siamou"], ["sig", "Paasaal"], ["sih", "Zire, Sîshëë"], ["sii", "Shom Peng"], ["sij", "Numbami"], ["sik", "Sikiana"], ["sil", "Tumulung Sisaala"], ["sim", "Mende (Papua New Guinea)"], ["sio", "Siouan languages"], ["sip", "Sikkimese"], ["siq", "Sonia"], ["sir", "Siri"], ["sis", "Siuslaw"], ["sit", "Sino-Tibetan languages"], ["siu", "Sinagen"], ["siv", "Sumariup"], ["siw", "Siwai"], ["six", "Sumau"], ["siy", "Sivandi"], ["siz", "Siwi"], ["sja", "Epena"], ["sjb", "Sajau Basap"], ["sjd", "Kildin Sami"], ["sje", "Pite Sami"], ["sjg", "Assangori"], ["sjk", "Kemi Sami"], ["sjl", "Sajalong, Miji"], ["sjm", "Mapun"], ["sjn", "Sindarin"], ["sjo", "Xibe"], ["sjp", "Surjapuri"], ["sjr", "Siar-Lak"], ["sjs", "Senhaja De Srair"], ["sjt", "Ter Sami"], ["sju", "Ume Sami"], ["sjw", "Shawnee"], ["ska", "Skagit"], ["skb", "Saek"], ["skc", "Ma Manda"], ["skd", "Southern Sierra Miwok"], ["ske", "Seke (Vanuatu)"], ["skf", "Sakirabiá"], ["skg", "Sakalava Malagasy"], ["skh", "Sikule"], ["ski", "Sika"], ["skj", "Seke (Nepal)"], ["skk", "Sok"], ["skm", "Kutong"], ["skn", "Kolibugan Subanon"], ["sko", "Seko Tengah"], ["skp", "Sekapan"], ["skq", "Sininkere"], ["skr", "Saraiki, Seraiki"], ["sks", "Maia"], ["skt", "Sakata"], ["sku", "Sakao"], ["skv", "Skou"], ["skw", "Skepi Creole Dutch"], ["skx", "Seko Padang"], ["sky", "Sikaiana"], ["skz", "Sekar"], ["sla", "Slavic languages"], ["slc", "Sáliba"], ["sld", "Sissala"], ["sle", "Sholaga"], ["slf", "Swiss-Italian Sign Language"], ["slg", "Selungai Murut"], ["slh", "Southern Puget Sound Salish"], ["sli", "Lower Silesian"], ["slj", "Salumá"], ["sll", "Salt-Yui"], ["slm", "Pangutaran Sama"], ["sln", "Salinan"], ["slp", "Lamaholot"], ["slq", "Salchuq"], ["slr", "Salar"], ["sls", "Singapore Sign Language"], ["slt", "Sila"], ["slu", "Selaru"], ["slw", "Sialum"], ["slx", "Salampasu"], ["sly", "Selayar"], ["slz", "Ma'ya"], ["sma", "Southern Sami"], ["smb", "Simbari"], ["smc", "Som"], ["smd", "Sama"], ["smf", "Auwe"], ["smg", "Simbali"], ["smh", "Samei"], ["smi", "Sami languages"], ["smj", "Lule Sami"], ["smk", "Bolinao"], ["sml", "Central Sama"], ["smm", "Musasa"], ["smn", "Inari Sami"], ["smp", "Samaritan"], ["smq", "Samo"], ["smr", "Simeulue"], ["sms", "Skolt Sami"], ["smt", "Simte"], ["smu", "Somray"], ["smv", "Samvedi"], ["smw", "Sumbawa"], ["smx", "Samba"], ["smy", "Semnani"], ["smz", "Simeku"], ["snb", "Sebuyau"], ["snc", "Sinaugoro"], ["sne", "Bau Bidayuh"], ["snf", "Noon"], ["sng", "Sanga (Democratic Republic of Congo)"], ["snh", "Shinabo"], ["sni", "Sensi"], ["snj", "Riverain Sango"], ["snk", "Soninke"], ["snl", "Sangil"], ["snm", "Southern Ma'di"], ["snn", "Siona"], ["sno", "Snohomish"], ["snp", "Siane"], ["snq", "Sangu (Gabon)"], ["snr", "Sihan"], ["sns", "South West Bay, Nahavaq"], ["snu", "Senggi, Viid"], ["snv", "Sa'ban"], ["snw", "Selee"], ["snx", "Sam"], ["sny", "Saniyo-Hiyewe"], ["snz", "Kou"], ["soa", "Thai Song"], ["sob", "Sobei"], ["soc", "So (Democratic Republic of Congo)"], ["sod", "Songoora"], ["soe", "Songomeno"], ["sog", "Sogdian"], ["soh", "Aka"], ["soi", "Sonha"], ["soj", "Soi"], ["sok", "Sokoro"], ["sol", "Solos"], ["son", "Songhai languages"], ["soo", "Songo"], ["sop", "Songe"], ["soq", "Kanasi"], ["sor", "Somrai"], ["sos", "Seeku"], ["sou", "Southern Thai"], ["sov", "Sonsorol"], ["sow", "Sowanda"], ["sox", "Swo"], ["soy", "Miyobe"], ["soz", "Temi"], ["spb", "Sepa (Indonesia)"], ["spc", "Sapé"], ["spd", "Saep"], ["spe", "Sepa (Papua New Guinea)"], ["spg", "Sian"], ["spi", "Saponi"], ["spk", "Sengo"], ["spl", "Selepet"], ["spm", "Akukem"], ["spn", "Sanapaná"], ["spo", "Spokane"], ["spp", "Supyire Senoufo"], ["spq", "Loreto-Ucayali Spanish"], ["spr", "Saparua"], ["sps", "Saposa"], ["spt", "Spiti Bhoti"], ["spu", "Sapuan"], ["spv", "Sambalpuri, Kosli"], ["spx", "South Picene"], ["spy", "Sabaot"], ["sqa", "Shama-Sambuga"], ["sqh", "Shau"], ["sqj", "Albanian languages"], ["sqk", "Albanian Sign Language"], ["sqm", "Suma"], ["sqn", "Susquehannock"], ["sqo", "Sorkhei"], ["sqq", "Sou"], ["sqr", "Siculo Arabic"], ["sqs", "Sri Lankan Sign Language"], ["sqt", "Soqotri"], ["squ", "Squamish"], ["sqx", "Kufr Qassem Sign Language (KQSL)"], ["sra", "Saruga"], ["srb", "Sora"], ["src", "Logudorese Sardinian"], ["sre", "Sara"], ["srf", "Nafi"], ["srg", "Sulod"], ["srh", "Sarikoli"], ["sri", "Siriano"], ["srk", "Serudung Murut"], ["srl", "Isirawa"], ["srm", "Saramaccan"], ["srn", "Sranan Tongo"], ["sro", "Campidanese Sardinian"], ["srq", "Sirionó"], ["srr", "Serer"], ["srs", "Sarsi"], ["srt", "Sauri"], ["sru", "Suruí"], ["srv", "Southern Sorsoganon"], ["srw", "Serua"], ["srx", "Sirmauri"], ["sry", "Sera"], ["srz", "Shahmirzadi"], ["ssa", "Nilo-Saharan languages"], ["ssb", "Southern Sama"], ["ssc", "Suba-Simbiti"], ["ssd", "Siroi"], ["sse", "Balangingi, Bangingih Sama"], ["ssf", "Thao"], ["ssg", "Seimat"], ["ssh", "Shihhi Arabic"], ["ssi", "Sansi"], ["ssj", "Sausi"], ["ssk", "Sunam"], ["ssl", "Western Sisaala"], ["ssm", "Semnam"], ["ssn", "Waata"], ["sso", "Sissano"], ["ssp", "Spanish Sign Language"], ["ssq", "So'a"], ["ssr", "Swiss-French Sign Language"], ["sss", "Sô"], ["sst", "Sinasina"], ["ssu", "Susuami"], ["ssv", "Shark Bay"], ["ssx", "Samberigi"], ["ssy", "Saho"], ["ssz", "Sengseng"], ["sta", "Settla"], ["stb", "Northern Subanen"], ["std", "Sentinel"], ["ste", "Liana-Seti"], ["stf", "Seta"], ["stg", "Trieng"], ["sth", "Shelta"], ["sti", "Bulo Stieng"], ["stj", "Matya Samo"], ["stk", "Arammba"], ["stl", "Stellingwerfs"], ["stm", "Setaman"], ["stn", "Owa"], ["sto", "Stoney"], ["stp", "Southeastern Tepehuan"], ["stq", "Saterfriesisch"], ["str", "Straits Salish"], ["sts", "Shumashti"], ["stt", "Budeh Stieng"], ["stu", "Samtao"], ["stv", "Silt'e"], ["stw", "Satawalese"], ["sty", "Siberian Tatar"], ["sua", "Sulka"], ["sub", "Suku"], ["suc", "Western Subanon"], ["sue", "Suena"], ["sug", "Suganga"], ["sui", "Suki"], ["suj", "Shubi"], ["suk", "Sukuma"], ["sul", "Surigaonon"], ["sum", "Sumo-Mayangna"], ["suo", "Bouni"], ["suq", "Tirmaga-Chai Suri, Suri"], ["sur", "Mwaghavul"], ["sus", "Susu"], ["sut", "Subtiaba"], ["suv", "Puroik"], ["suw", "Sumbwa"], ["sux", "Sumerian"], ["suy", "Suyá"], ["suz", "Sunwar"], ["sva", "Svan"], ["svb", "Ulau-Suain"], ["svc", "Vincentian Creole English"], ["sve", "Serili"], ["svk", "Slovakian Sign Language"], ["svm", "Slavomolisano"], ["svr", "Savara"], ["svs", "Savosavo"], ["svx", "Skalvian"], ["swb", "Maore Comorian"], ["swc", "Congo Swahili"], ["swf", "Sere"], ["swg", "Swabian"], ["swh", "Swahili (individual language), Kiswahili"], ["swi", "Sui"], ["swj", "Sira"], ["swk", "Malawi Sena"], ["swl", "Swedish Sign Language"], ["swm", "Samosa"], ["swn", "Sawknah"], ["swo", "Shanenawa"], ["swp", "Suau"], ["swq", "Sharwa"], ["swr", "Saweru"], ["sws", "Seluwasan"], ["swt", "Sawila"], ["swu", "Suwawa"], ["swv", "Shekhawati"], ["sww", "Sowa"], ["swx", "Suruahá"], ["swy", "Sarua"], ["sxb", "Suba"], ["sxc", "Sicanian"], ["sxe", "Sighu"], ["sxg", "Shuhi, Shixing"], ["sxk", "Southern Kalapuya"], ["sxl", "Selian"], ["sxm", "Samre"], ["sxn", "Sangir"], ["sxo", "Sorothaptic"], ["sxr", "Saaroa"], ["sxs", "Sasaru"], ["sxu", "Upper Saxon"], ["sxw", "Saxwe Gbe"], ["sya", "Siang"], ["syb", "Central Subanen"], ["syc", "Classical Syriac"], ["syd", "Samoyedic languages"], ["syi", "Seki"], ["syk", "Sukur"], ["syl", "Sylheti"], ["sym", "Maya Samo"], ["syn", "Senaya"], ["syo", "Suoy"], ["syr", "Syriac"], ["sys", "Sinyar"], ["syw", "Kagate"], ["syx", "Samay"], ["syy", "Al-Sayyid Bedouin Sign Language"], ["sza", "Semelai"], ["szb", "Ngalum"], ["szc", "Semaq Beri"], ["szd", "Seru"], ["sze", "Seze"], ["szg", "Sengele"], ["szl", "Silesian"], ["szn", "Sula"], ["szp", "Suabo"], ["szs", "Solomon Islands Sign Language"], ["szv", "Isu (Fako Division)"], ["szw", "Sawai"], ["szy", "Sakizaya"], ["taa", "Lower Tanana"], ["tab", "Tabassaran"], ["tac", "Lowland Tarahumara"], ["tad", "Tause"], ["tae", "Tariana"], ["taf", "Tapirapé"], ["tag", "Tagoi"], ["tai", "Tai languages"], ["taj", "Eastern Tamang"], ["tak", "Tala"], ["tal", "Tal"], ["tan", "Tangale"], ["tao", "Yami"], ["tap", "Taabwa"], ["taq", "Tamasheq"], ["tar", "Central Tarahumara"], ["tas", "Tay Boi"], ["tau", "Upper Tanana"], ["tav", "Tatuyo"], ["taw", "Tai"], ["tax", "Tamki"], ["tay", "Atayal"], ["taz", "Tocho"], ["tba", "Aikanã"], ["tbb", "Tapeba"], ["tbc", "Takia"], ["tbd", "Kaki Ae"], ["tbe", "Tanimbili"], ["tbf", "Mandara"], ["tbg", "North Tairora"], ["tbh", "Dharawal, Thurawal"], ["tbi", "Gaam"], ["tbj", "Tiang"], ["tbk", "Calamian Tagbanwa"], ["tbl", "Tboli"], ["tbm", "Tagbu"], ["tbn", "Barro Negro Tunebo"], ["tbo", "Tawala"], ["tbp", "Taworta, Diebroud"], ["tbq", "Tibeto-Burman languages"], ["tbr", "Tumtum"], ["tbs", "Tanguat"], ["tbt", "Tembo (Kitembo)"], ["tbu", "Tubar"], ["tbv", "Tobo"], ["tbw", "Tagbanwa"], ["tbx", "Kapin"], ["tby", "Tabaru"], ["tbz", "Ditammari"], ["tca", "Ticuna"], ["tcb", "Tanacross"], ["tcc", "Datooga"], ["tcd", "Tafi"], ["tce", "Southern Tutchone"], ["tcf", "Malinaltepec Me'phaa, Malinaltepec Tlapanec"], ["tcg", "Tamagario"], ["tch", "Turks And Caicos Creole English"], ["tci", "Wára"], ["tck", "Tchitchege"], ["tcl", "Taman (Myanmar)"], ["tcm", "Tanahmerah"], ["tcn", "Tichurong"], ["tco", "Taungyo"], ["tcp", "Tawr Chin"], ["tcq", "Kaiy"], ["tcs", "Torres Strait Creole, Yumplatok"], ["tct", "T'en"], ["tcu", "Southeastern Tarahumara"], ["tcw", "Tecpatlán Totonac"], ["tcx", "Toda"], ["tcy", "Tulu"], ["tcz", "Thado Chin"], ["tda", "Tagdal"], ["tdb", "Panchpargania"], ["tdc", "Emberá-Tadó"], ["tdd", "Tai Nüa"], ["tde", "Tiranige Diga Dogon"], ["tdf", "Talieng"], ["tdg", "Western Tamang"], ["tdh", "Thulung"], ["tdi", "Tomadino"], ["tdj", "Tajio"], ["tdk", "Tambas"], ["tdl", "Sur"], ["tdm", "Taruma"], ["tdn", "Tondano"], ["tdo", "Teme"], ["tdq", "Tita"], ["tdr", "Todrah"], ["tds", "Doutai"], ["tdt", "Tetun Dili"], ["tdu", "Tempasuk Dusun"], ["tdv", "Toro"], ["tdx", "Tandroy-Mahafaly Malagasy"], ["tdy", "Tadyawan"], ["tea", "Temiar"], ["teb", "Tetete"], ["tec", "Terik"], ["ted", "Tepo Krumen"], ["tee", "Huehuetla Tepehua"], ["tef", "Teressa"], ["teg", "Teke-Tege"], ["teh", "Tehuelche"], ["tei", "Torricelli"], ["tek", "Ibali Teke"], ["tem", "Timne"], ["ten", "Tama (Colombia)"], ["teo", "Teso"], ["tep", "Tepecano"], ["teq", "Temein"], ["ter", "Tereno"], ["tes", "Tengger"], ["tet", "Tetum"], ["teu", "Soo"], ["tev", "Teor"], ["tew", "Tewa (USA)"], ["tex", "Tennet"], ["tey", "Tulishi"], ["tez", "Tetserret"], ["tfi", "Tofin Gbe"], ["tfn", "Tanaina"], ["tfo", "Tefaro"], ["tfr", "Teribe"], ["tft", "Ternate"], ["tga", "Sagalla"], ["tgb", "Tobilung"], ["tgc", "Tigak"], ["tgd", "Ciwogai"], ["tge", "Eastern Gorkha Tamang"], ["tgf", "Chalikha"], ["tgg", "Tangga"], ["tgh", "Tobagonian Creole English"], ["tgi", "Lawunuia"], ["tgj", "Tagin"], ["tgn", "Tandaganon"], ["tgo", "Sudest"], ["tgp", "Tangoa"], ["tgq", "Tring"], ["tgr", "Tareng"], ["tgs", "Nume"], ["tgt", "Central Tagbanwa"], ["tgu", "Tanggu"], ["tgv", "Tingui-Boto"], ["tgw", "Tagwana Senoufo"], ["tgx", "Tagish"], ["tgy", "Togoyo"], ["tgz", "Tagalaka"], ["thc", "Tai Hang Tong"], ["thd", "Kuuk Thaayorre, Thayore"], ["the", "Chitwania Tharu"], ["thf", "Thangmi"], ["thh", "Northern Tarahumara"], ["thi", "Tai Long"], ["thk", "Tharaka, Kitharaka"], ["thl", "Dangaura Tharu"], ["thm", "Aheu"], ["thn", "Thachanadan"], ["thp", "Thompson"], ["thq", "Kochila Tharu"], ["thr", "Rana Tharu"], ["ths", "Thakali"], ["tht", "Tahltan"], ["thu", "Thuri"], ["thv", "Tahaggart Tamahaq"], ["thw", "Thudam"], ["thx", "The"], ["thy", "Tha"], ["thz", "Tayart Tamajeq"], ["tia", "Tidikelt Tamazight"], ["tic", "Tira"], ["tid", "Tidong"], ["tie", "Tingal"], ["tif", "Tifal"], ["tig", "Tigre"], ["tih", "Timugon Murut"], ["tii", "Tiene"], ["tij", "Tilung"], ["tik", "Tikar"], ["til", "Tillamook"], ["tim", "Timbe"], ["tin", "Tindi"], ["tio", "Teop"], ["tip", "Trimuris"], ["tiq", "Tiéfo"], ["tis", "Masadiit Itneg"], ["tit", "Tinigua"], ["tiu", "Adasen"], ["tiv", "Tiv"], ["tiw", "Tiwi"], ["tix", "Southern Tiwa"], ["tiy", "Tiruray"], ["tiz", "Tai Hongjin"], ["tja", "Tajuasohn"], ["tjg", "Tunjung"], ["tji", "Northern Tujia"], ["tjj", "Tjungundji"], ["tjl", "Tai Laing"], ["tjm", "Timucua"], ["tjn", "Tonjon"], ["tjo", "Temacine Tamazight"], ["tjp", "Tjupany"], ["tjs", "Southern Tujia"], ["tju", "Tjurruru"], ["tjw", "Djabwurrung"], ["tka", "Truká"], ["tkb", "Buksa"], ["tkd", "Tukudede"], ["tke", "Takwane"], ["tkf", "Tukumanféd"], ["tkg", "Tesaka Malagasy"], ["tkk", "Takpa"], ["tkl", "Tokelau"], ["tkm", "Takelma"], ["tkn", "Toku-No-Shima"], ["tkp", "Tikopia"], ["tkq", "Tee"], ["tkr", "Tsakhur"], ["tks", "Takestani"], ["tkt", "Kathoriya Tharu"], ["tku", "Upper Necaxa Totonac"], ["tkv", "Mur Pano"], ["tkw", "Teanu"], ["tkx", "Tangko"], ["tkz", "Takua"], ["tla", "Southwestern Tepehuan"], ["tlb", "Tobelo"], ["tlc", "Yecuatla Totonac"], ["tld", "Talaud"], ["tlf", "Telefol"], ["tlg", "Tofanma"], ["tlh", "Klingon, tlhIngan Hol"], ["tli", "Tlingit"], ["tlj", "Talinga-Bwisi"], ["tlk", "Taloki"], ["tll", "Tetela"], ["tlm", "Tolomako"], ["tln", "Talondo'"], ["tlo", "Talodi"], ["tlp", "Filomena Mata-Coahuitlán Totonac"], ["tlq", "Tai Loi"], ["tlr", "Talise"], ["tls", "Tambotalo"], ["tlt", "Sou Nama, Teluti"], ["tlu", "Tulehu"], ["tlv", "Taliabu"], ["tlw", "South Wemale"], ["tlx", "Khehek"], ["tly", "Talysh"], ["tma", "Tama (Chad)"], ["tmb", "Katbol, Avava"], ["tmc", "Tumak"], ["tmd", "Haruai"], ["tme", "Tremembé"], ["tmf", "Toba-Maskoy"], ["tmg", "Ternateño"], ["tmh", "Tamashek"], ["tmi", "Tutuba"], ["tmj", "Samarokena"], ["tmk", "Northwestern Tamang"], ["tml", "Tamnim Citak"], ["tmm", "Tai Thanh"], ["tmn", "Taman (Indonesia)"], ["tmo", "Temoq"], ["tmp", "Tai Mène"], ["tmq", "Tumleo"], ["tmr", "Jewish Babylonian Aramaic (ca. 200-1200 CE)"], ["tms", "Tima"], ["tmt", "Tasmate"], ["tmu", "Iau"], ["tmv", "Tembo (Motembo)"], ["tmw", "Temuan"], ["tmy", "Tami"], ["tmz", "Tamanaku"], ["tna", "Tacana"], ["tnb", "Western Tunebo"], ["tnc", "Tanimuca-Retuarã"], ["tnd", "Angosturas Tunebo"], ["tne", "Tinoc Kallahan"], ["tnf", "Tangshewi"], ["tng", "Tobanga"], ["tnh", "Maiani"], ["tni", "Tandia"], ["tnk", "Kwamera"], ["tnl", "Lenakel"], ["tnm", "Tabla"], ["tnn", "North Tanna"], ["tno", "Toromono"], ["tnp", "Whitesands"], ["tnq", "Taino"], ["tnr", "Ménik"], ["tns", "Tenis"], ["tnt", "Tontemboan"], ["tnu", "Tay Khang"], ["tnv", "Tangchangya"], ["tnw", "Tonsawang"], ["tnx", "Tanema"], ["tny", "Tongwe"], ["tnz", "Ten'edn"], ["tob", "Toba"], ["toc", "Coyutla Totonac"], ["tod", "Toma"], ["toe", "Tomedes"], ["tof", "Gizrra"], ["tog", "Tonga (Nyasa)"], ["toh", "Gitonga"], ["toi", "Tonga (Zambia)"], ["toj", "Tojolabal"], ["tol", "Tolowa"], ["tom", "Tombulu"], ["too", "Xicotepec De Juárez Totonac"], ["top", "Papantla Totonac"], ["toq", "Toposa"], ["tor", "Togbo-Vara Banda"], ["tos", "Highland Totonac"], ["tou", "Tho"], ["tov", "Upper Taromi"], ["tow", "Jemez"], ["tox", "Tobian"], ["toy", "Topoiyo"], ["toz", "To"], ["tpa", "Taupota"], ["tpc", "Azoyú Me'phaa, Azoyú Tlapanec"], ["tpe", "Tippera"], ["tpf", "Tarpia"], ["tpg", "Kula"], ["tpi", "Tok Pisin"], ["tpj", "Tapieté"], ["tpk", "Tupinikin"], ["tpl", "Tlacoapa Me'phaa, Tlacoapa Tlapanec"], ["tpm", "Tampulma"], ["tpn", "Tupinambá"], ["tpo", "Tai Pao"], ["tpp", "Pisaflores Tepehua"], ["tpq", "Tukpa"], ["tpr", "Tuparí"], ["tpt", "Tlachichilco Tepehua"], ["tpu", "Tampuan"], ["tpv", "Tanapag"], ["tpw", "Tupí"], ["tpx", "Acatepec Me'phaa, Acatepec Tlapanec"], ["tpy", "Trumai"], ["tpz", "Tinputz"], ["tqb", "Tembé"], ["tql", "Lehali"], ["tqm", "Turumsa"], ["tqn", "Tenino"], ["tqo", "Toaripi"], ["tqp", "Tomoip"], ["tqq", "Tunni"], ["tqr", "Torona"], ["tqt", "Western Totonac"], ["tqu", "Touo"], ["tqw", "Tonkawa"], ["tra", "Tirahi"], ["trb", "Terebu"], ["trc", "Copala Triqui"], ["trd", "Turi"], ["tre", "East Tarangan"], ["trf", "Trinidadian Creole English"], ["trg", "Lishán Didán"], ["trh", "Turaka"], ["tri", "Trió"], ["trj", "Toram"], ["trk", "Turkic languages"], ["trl", "Traveller Scottish"], ["trm", "Tregami"], ["trn", "Trinitario"], ["tro", "Tarao Naga"], ["trp", "Kok Borok"], ["trq", "San Martín Itunyoso Triqui"], ["trr", "Taushiro"], ["trs", "Chicahuaxtla Triqui"], ["trt", "Tunggare"], ["tru", "Turoyo, Surayt"], ["trv", "Taroko"], ["trw", "Torwali"], ["trx", "Tringgus-Sembaan Bidayuh"], ["try", "Turung"], ["trz", "Torá"], ["tsa", "Tsaangi"], ["tsb", "Tsamai"], ["tsc", "Tswa"], ["tsd", "Tsakonian"], ["tse", "Tunisian Sign Language"], ["tsf", "Southwestern Tamang"], ["tsg", "Tausug"], ["tsh", "Tsuvan"], ["tsi", "Tsimshian"], ["tsj", "Tshangla"], ["tsk", "Tseku"], ["tsl", "Ts'ün-Lao"], ["tsm", "Turkish Sign Language, Türk İşaret Dili"], ["tsp", "Northern Toussian"], ["tsq", "Thai Sign Language"], ["tsr", "Akei"], ["tss", "Taiwan Sign Language"], ["tst", "Tondi Songway Kiini"], ["tsu", "Tsou"], ["tsv", "Tsogo"], ["tsw", "Tsishingini"], ["tsx", "Mubami"], ["tsy", "Tebul Sign Language"], ["tsz", "Purepecha"], ["tta", "Tutelo"], ["ttb", "Gaa"], ["ttc", "Tektiteko"], ["ttd", "Tauade"], ["tte", "Bwanabwana"], ["ttf", "Tuotomb"], ["ttg", "Tutong"], ["tth", "Upper Ta'oih"], ["tti", "Tobati"], ["ttj", "Tooro"], ["ttk", "Totoro"], ["ttl", "Totela"], ["ttm", "Northern Tutchone"], ["ttn", "Towei"], ["tto", "Lower Ta'oih"], ["ttp", "Tombelala"], ["ttq", "Tawallammat Tamajaq"], ["ttr", "Tera"], ["tts", "Northeastern Thai"], ["ttt", "Muslim Tat"], ["ttu", "Torau"], ["ttv", "Titan"], ["ttw", "Long Wat"], ["tty", "Sikaritai"], ["ttz", "Tsum"], ["tua", "Wiarumus"], ["tub", "Tübatulabal"], ["tuc", "Mutu"], ["tud", "Tuxá"], ["tue", "Tuyuca"], ["tuf", "Central Tunebo"], ["tug", "Tunia"], ["tuh", "Taulil"], ["tui", "Tupuri"], ["tuj", "Tugutil"], ["tul", "Tula"], ["tum", "Tumbuka"], ["tun", "Tunica"], ["tuo", "Tucano"], ["tup", "Tupi languages"], ["tuq", "Tedaga"], ["tus", "Tuscarora"], ["tut", "Altaic languages"], ["tuu", "Tututni"], ["tuv", "Turkana"], ["tuw", "Tungus languages"], ["tux", "Tuxináwa"], ["tuy", "Tugen"], ["tuz", "Turka"], ["tva", "Vaghua"], ["tvd", "Tsuvadi"], ["tve", "Te'un"], ["tvk", "Southeast Ambrym"], ["tvl", "Tuvalu"], ["tvm", "Tela-Masbuar"], ["tvn", "Tavoyan"], ["tvo", "Tidore"], ["tvs", "Taveta"], ["tvt", "Tutsa Naga"], ["tvu", "Tunen"], ["tvw", "Sedoa"], ["tvx", "Taivoan"], ["tvy", "Timor Pidgin"], ["twa", "Twana"], ["twb", "Western Tawbuid"], ["twc", "Teshenawa"], ["twd", "Twents"], ["twe", "Tewa (Indonesia)"], ["twf", "Northern Tiwa"], ["twg", "Tereweng"], ["twh", "Tai Dón"], ["twl", "Tawara"], ["twm", "Tawang Monpa"], ["twn", "Twendi"], ["two", "Tswapong"], ["twp", "Ere"], ["twq", "Tasawaq"], ["twr", "Southwestern Tarahumara"], ["twt", "Turiwára"], ["twu", "Termanu"], ["tww", "Tuwari"], ["twx", "Tewe"], ["twy", "Tawoyan"], ["txa", "Tombonuo"], ["txb", "Tokharian B"], ["txc", "Tsetsaut"], ["txe", "Totoli"], ["txg", "Tangut"], ["txh", "Thracian"], ["txi", "Ikpeng"], ["txj", "Tarjumo"], ["txm", "Tomini"], ["txn", "West Tarangan"], ["txo", "Toto"], ["txq", "Tii"], ["txr", "Tartessian"], ["txs", "Tonsea"], ["txt", "Citak"], ["txu", "Kayapó"], ["txx", "Tatana"], ["txy", "Tanosy Malagasy"], ["tya", "Tauya"], ["tye", "Kyanga"], ["tyh", "O'du"], ["tyi", "Teke-Tsaayi"], ["tyj", "Tai Do, Tai Yo"], ["tyl", "Thu Lao"], ["tyn", "Kombai"], ["typ", "Thaypan"], ["tyr", "Tai Daeng"], ["tys", "Tày Sa Pa"], ["tyt", "Tày Tac"], ["tyu", "Kua"], ["tyv", "Tuvinian"], ["tyx", "Teke-Tyee"], ["tyy", "Tiyaa"], ["tyz", "Tày"], ["tza", "Tanzanian Sign Language"], ["tzh", "Tzeltal"], ["tzj", "Tz'utujil"], ["tzl", "Talossan"], ["tzm", "Central Atlas Tamazight"], ["tzn", "Tugun"], ["tzo", "Tzotzil"], ["tzx", "Tabriak"], ["uam", "Uamué"], ["uan", "Kuan"], ["uar", "Tairuma"], ["uba", "Ubang"], ["ubi", "Ubi"], ["ubl", "Buhi'non Bikol"], ["ubr", "Ubir"], ["ubu", "Umbu-Ungu"], ["uby", "Ubykh"], ["uda", "Uda"], ["ude", "Udihe"], ["udg", "Muduga"], ["udi", "Udi"], ["udj", "Ujir"], ["udl", "Wuzlam"], ["udm", "Udmurt"], ["udu", "Uduk"], ["ues", "Kioko"], ["ufi", "Ufim"], ["uga", "Ugaritic"], ["ugb", "Kuku-Ugbanh"], ["uge", "Ughele"], ["ugn", "Ugandan Sign Language"], ["ugo", "Ugong"], ["ugy", "Uruguayan Sign Language"], ["uha", "Uhami"], ["uhn", "Damal"], ["uis", "Uisai"], ["uiv", "Iyive"], ["uji", "Tanjijili"], ["uka", "Kaburi"], ["ukg", "Ukuriguma"], ["ukh", "Ukhwejo"], ["uki", "Kui (India)"], ["ukk", "Muak Sa-aak"], ["ukl", "Ukrainian Sign Language"], ["ukp", "Ukpe-Bayobiri"], ["ukq", "Ukwa"], ["uks", "Urubú-Kaapor Sign Language, Kaapor Sign Language"], ["uku", "Ukue"], ["ukv", "Kuku"], ["ukw", "Ukwuani-Aboh-Ndoni"], ["uky", "Kuuk-Yak"], ["ula", "Fungwa"], ["ulb", "Ulukwumi"], ["ulc", "Ulch"], ["ule", "Lule"], ["ulf", "Usku, Afra"], ["uli", "Ulithian"], ["ulk", "Meriam Mir"], ["ull", "Ullatan"], ["ulm", "Ulumanda'"], ["uln", "Unserdeutsch"], ["ulu", "Uma' Lung"], ["ulw", "Ulwa"], ["uma", "Umatilla"], ["umb", "Umbundu"], ["umc", "Marrucinian"], ["umd", "Umbindhamu"], ["umg", "Morrobalama, Umbuygamu"], ["umi", "Ukit"], ["umm", "Umon"], ["umn", "Makyan Naga"], ["umo", "Umotína"], ["ump", "Umpila"], ["umr", "Umbugarla"], ["ums", "Pendau"], ["umu", "Munsee"], ["una", "North Watut"], ["und", "Undetermined"], ["une", "Uneme"], ["ung", "Ngarinyin"], ["uni", "Uni"], ["unk", "Enawené-Nawé"], ["unm", "Unami"], ["unn", "Kurnai"], ["unp", "Worora"], ["unr", "Mundari"], ["unu", "Unubahe"], ["unx", "Munda"], ["unz", "Unde Kaili"], ["uok", "Uokha"], ["upi", "Umeda"], ["upv", "Uripiv-Wala-Rano-Atchin"], ["ura", "Urarina"], ["urb", "Urubú-Kaapor, Kaapor"], ["urc", "Urningangg"], ["ure", "Uru"], ["urf", "Uradhi"], ["urg", "Urigina"], ["urh", "Urhobo"], ["uri", "Urim"], ["urj", "Uralic languages"], ["urk", "Urak Lawoi'"], ["url", "Urali"], ["urm", "Urapmin"], ["urn", "Uruangnirin"], ["uro", "Ura (Papua New Guinea)"], ["urp", "Uru-Pa-In"], ["urr", "Lehalurup, Löyöp"], ["urt", "Urat"], ["uru", "Urumi"], ["urv", "Uruava"], ["urw", "Sop"], ["urx", "Urimo"], ["ury", "Orya"], ["urz", "Uru-Eu-Wau-Wau"], ["usa", "Usarufa"], ["ush", "Ushojo"], ["usi", "Usui"], ["usk", "Usaghade"], ["usp", "Uspanteco"], ["uss", "us-Saare"], ["usu", "Uya"], ["uta", "Otank"], ["ute", "Ute-Southern Paiute"], ["uth", "ut-Hun"], ["utp", "Amba (Solomon Islands)"], ["utr", "Etulo"], ["utu", "Utu"], ["uum", "Urum"], ["uun", "Kulon-Pazeh"], ["uur", "Ura (Vanuatu)"], ["uuu", "U"], ["uve", "West Uvean, Fagauvea"], ["uvh", "Uri"], ["uvl", "Lote"], ["uwa", "Kuku-Uwanh"], ["uya", "Doko-Uyanga"], ["uzn", "Northern Uzbek"], ["uzs", "Southern Uzbek"], ["vaa", "Vaagri Booli"], ["vae", "Vale"], ["vaf", "Vafsi"], ["vag", "Vagla"], ["vah", "Varhadi-Nagpuri"], ["vai", "Vai"], ["vaj", "Sekele, Northwestern ǃKung, Vasekele"], ["val", "Vehes"], ["vam", "Vanimo"], ["van", "Valman"], ["vao", "Vao"], ["vap", "Vaiphei"], ["var", "Huarijio"], ["vas", "Vasavi"], ["vau", "Vanuma"], ["vav", "Varli"], ["vay", "Wayu"], ["vbb", "Southeast Babar"], ["vbk", "Southwestern Bontok"], ["vec", "Venetian"], ["ved", "Veddah"], ["vel", "Veluws"], ["vem", "Vemgo-Mabas"], ["veo", "Ventureño"], ["vep", "Veps"], ["ver", "Mom Jango"], ["vgr", "Vaghri"], ["vgt", "Vlaamse Gebarentaal, Flemish Sign Language"], ["vic", "Virgin Islands Creole English"], ["vid", "Vidunda"], ["vif", "Vili"], ["vig", "Viemo"], ["vil", "Vilela"], ["vin", "Vinza"], ["vis", "Vishavan"], ["vit", "Viti"], ["viv", "Iduna"], ["vka", "Kariyarra"], ["vki", "Ija-Zuba"], ["vkj", "Kujarge"], ["vkk", "Kaur"], ["vkl", "Kulisusu"], ["vkm", "Kamakan"], ["vkn", "Koro Nulu"], ["vko", "Kodeoha"], ["vkp", "Korlai Creole Portuguese"], ["vkt", "Tenggarong Kutai Malay"], ["vku", "Kurrama"], ["vkz", "Koro Zuba"], ["vlp", "Valpei"], ["vls", "Vlaams"], ["vma", "Martuyhunira"], ["vmb", "Barbaram"], ["vmc", "Juxtlahuaca Mixtec"], ["vmd", "Mudu Koraga"], ["vme", "East Masela"], ["vmf", "Mainfränkisch"], ["vmg", "Lungalunga"], ["vmh", "Maraghei"], ["vmi", "Miwa"], ["vmj", "Ixtayutla Mixtec"], ["vmk", "Makhuwa-Shirima"], ["vml", "Malgana"], ["vmm", "Mitlatongo Mixtec"], ["vmp", "Soyaltepec Mazatec"], ["vmq", "Soyaltepec Mixtec"], ["vmr", "Marenje"], ["vms", "Moksela"], ["vmu", "Muluridyi"], ["vmv", "Valley Maidu"], ["vmw", "Makhuwa"], ["vmx", "Tamazola Mixtec"], ["vmy", "Ayautla Mazatec"], ["vmz", "Mazatlán Mazatec"], ["vnk", "Vano, Lovono"], ["vnm", "Vinmavis, Neve'ei"], ["vnp", "Vunapu"], ["vor", "Voro"], ["vot", "Votic"], ["vra", "Vera'a"], ["vro", "Võro"], ["vrs", "Varisi"], ["vrt", "Burmbar, Banam Bay"], ["vsi", "Moldova Sign Language"], ["vsl", "Venezuelan Sign Language"], ["vsv", "Valencian Sign Language, Llengua de signes valenciana"], ["vto", "Vitou"], ["vum", "Vumbu"], ["vun", "Vunjo"], ["vut", "Vute"], ["vwa", "Awa (China)"], ["waa", "Walla Walla"], ["wab", "Wab"], ["wac", "Wasco-Wishram"], ["wad", "Wamesa, Wondama"], ["wae", "Walser"], ["waf", "Wakoná"], ["wag", "Wa'ema"], ["wah", "Watubela"], ["wai", "Wares"], ["waj", "Waffa"], ["wak", "Wakashan languages"], ["wal", "Wolaytta, Wolaitta"], ["wam", "Wampanoag"], ["wan", "Wan"], ["wao", "Wappo"], ["wap", "Wapishana"], ["waq", "Wagiman"], ["war", "Waray (Philippines)"], ["was", "Washo"], ["wat", "Kaninuwa"], ["wau", "Waurá"], ["wav", "Waka"], ["waw", "Waiwai"], ["wax", "Watam, Marangis"], ["way", "Wayana"], ["waz", "Wampur"], ["wba", "Warao"], ["wbb", "Wabo"], ["wbe", "Waritai"], ["wbf", "Wara"], ["wbh", "Wanda"], ["wbi", "Vwanji"], ["wbj", "Alagwa"], ["wbk", "Waigali"], ["wbl", "Wakhi"], ["wbm", "Wa"], ["wbp", "Warlpiri"], ["wbq", "Waddar"], ["wbr", "Wagdi"], ["wbs", "West Bengal Sign Language"], ["wbt", "Warnman"], ["wbv", "Wajarri"], ["wbw", "Woi"], ["wca", "Yanomámi"], ["wci", "Waci Gbe"], ["wdd", "Wandji"], ["wdg", "Wadaginam"], ["wdj", "Wadjiginy"], ["wdk", "Wadikali"], ["wdu", "Wadjigu"], ["wdy", "Wadjabangayi"], ["wea", "Wewaw"], ["wec", "Wè Western"], ["wed", "Wedau"], ["weg", "Wergaia"], ["weh", "Weh"], ["wei", "Kiunum"], ["wem", "Weme Gbe"], ["wen", "Sorbian languages"], ["weo", "Wemale"], ["wep", "Westphalien"], ["wer", "Weri"], ["wes", "Cameroon Pidgin"], ["wet", "Perai"], ["weu", "Rawngtu Chin"], ["wew", "Wejewa"], ["wfg", "Yafi, Zorop"], ["wga", "Wagaya"], ["wgb", "Wagawaga"], ["wgg", "Wangkangurru, Wangganguru"], ["wgi", "Wahgi"], ["wgo", "Waigeo"], ["wgu", "Wirangu"], ["wgw", "Wagawaga"], ["wgy", "Warrgamay"], ["wha", "Sou Upaa, Manusela"], ["whg", "North Wahgi"], ["whk", "Wahau Kenyah"], ["whu", "Wahau Kayan"], ["wib", "Southern Toussian"], ["wic", "Wichita"], ["wie", "Wik-Epa"], ["wif", "Wik-Keyangan"], ["wig", "Wik Ngathan"], ["wih", "Wik-Me'anha"], ["wii", "Minidien"], ["wij", "Wik-Iiyanh"], ["wik", "Wikalkan"], ["wil", "Wilawila"], ["wim", "Wik-Mungkan"], ["win", "Ho-Chunk"], ["wir", "Wiraféd"], ["wit", "Wintu"], ["wiu", "Wiru"], ["wiv", "Vitu"], ["wiw", "Wirangu"], ["wiy", "Wiyot"], ["wja", "Waja"], ["wji", "Warji"], ["wka", "Kw'adza"], ["wkb", "Kumbaran"], ["wkd", "Wakde, Mo"], ["wkl", "Kalanadi"], ["wkr", "Keerray-Woorroong"], ["wku", "Kunduvadi"], ["wkw", "Wakawaka"], ["wky", "Wangkayutyuru"], ["wla", "Walio"], ["wlc", "Mwali Comorian"], ["wle", "Wolane"], ["wlg", "Kunbarlang"], ["wlh", "Welaun"], ["wli", "Waioli"], ["wlk", "Wailaki"], ["wll", "Wali (Sudan)"], ["wlm", "Middle Welsh"], ["wlo", "Wolio"], ["wlr", "Wailapa"], ["wls", "Wallisian"], ["wlu", "Wuliwuli"], ["wlv", "Wichí Lhamtés Vejoz"], ["wlw", "Walak"], ["wlx", "Wali (Ghana)"], ["wly", "Waling"], ["wma", "Mawa (Nigeria)"], ["wmb", "Wambaya"], ["wmc", "Wamas"], ["wmd", "Mamaindé"], ["wme", "Wambule"], ["wmg", "Western Minyag"], ["wmh", "Waima'a"], ["wmi", "Wamin"], ["wmm", "Maiwa (Indonesia)"], ["wmn", "Waamwang"], ["wmo", "Wom (Papua New Guinea)"], ["wms", "Wambon"], ["wmt", "Walmajarri"], ["wmw", "Mwani"], ["wmx", "Womo"], ["wnb", "Wanambre"], ["wnc", "Wantoat"], ["wnd", "Wandarang"], ["wne", "Waneci"], ["wng", "Wanggom"], ["wni", "Ndzwani Comorian"], ["wnk", "Wanukaka"], ["wnm", "Wanggamala"], ["wnn", "Wunumara"], ["wno", "Wano"], ["wnp", "Wanap"], ["wnu", "Usan"], ["wnw", "Wintu"], ["wny", "Wanyi, Waanyi"], ["woa", "Kuwema, Tyaraity"], ["wob", "Wè Northern"], ["woc", "Wogeo"], ["wod", "Wolani"], ["woe", "Woleaian"], ["wof", "Gambian Wolof"], ["wog", "Wogamusin"], ["woi", "Kamang"], ["wok", "Longto"], ["wom", "Wom (Nigeria)"], ["won", "Wongo"], ["woo", "Manombai"], ["wor", "Woria"], ["wos", "Hanga Hundi"], ["wow", "Wawonii"], ["woy", "Weyto"], ["wpc", "Maco"], ["wra", "Warapu"], ["wrb", "Waluwarra, Warluwara"], ["wrd", "Warduji"], ["wrg", "Warungu, Gudjal"], ["wrh", "Wiradjuri"], ["wri", "Wariyangga"], ["wrk", "Garrwa"], ["wrl", "Warlmanpa"], ["wrm", "Warumungu"], ["wrn", "Warnang"], ["wro", "Worrorra"], ["wrp", "Waropen"], ["wrr", "Wardaman"], ["wrs", "Waris"], ["wru", "Waru"], ["wrv", "Waruna"], ["wrw", "Gugu Warra"], ["wrx", "Wae Rana"], ["wry", "Merwari"], ["wrz", "Waray (Australia)"], ["wsa", "Warembori"], ["wsg", "Adilabad Gondi"], ["wsi", "Wusi"], ["wsk", "Waskia"], ["wsr", "Owenia"], ["wss", "Wasa"], ["wsu", "Wasu"], ["wsv", "Wotapuri-Katarqalai"], ["wtf", "Watiwa"], ["wth", "Wathawurrung"], ["wti", "Berta"], ["wtk", "Watakataui"], ["wtm", "Mewati"], ["wtw", "Wotu"], ["wua", "Wikngenchera"], ["wub", "Wunambal"], ["wud", "Wudu"], ["wuh", "Wutunhua"], ["wul", "Silimo"], ["wum", "Wumbvu"], ["wun", "Bungu"], ["wur", "Wurrugu"], ["wut", "Wutung"], ["wuu", "Wu Chinese"], ["wuv", "Wuvulu-Aua"], ["wux", "Wulna"], ["wuy", "Wauyai"], ["wwa", "Waama"], ["wwb", "Wakabunga"], ["wwo", "Wetamut, Dorig"], ["wwr", "Warrwa"], ["www", "Wawa"], ["wxa", "Waxianghua"], ["wxw", "Wardandi"], ["wya", "Wyandot"], ["wyb", "Wangaaybuwan-Ngiyambaa"], ["wyi", "Woiwurrung"], ["wym", "Wymysorys"], ["wyr", "Wayoró"], ["wyy", "Western Fijian"], ["xaa", "Andalusian Arabic"], ["xab", "Sambe"], ["xac", "Kachari"], ["xad", "Adai"], ["xae", "Aequian"], ["xag", "Aghwan"], ["xai", "Kaimbé"], ["xaj", "Ararandewára"], ["xak", "Máku"], ["xal", "Kalmyk, Oirat"], ["xam", "ǀXam"], ["xan", "Xamtanga"], ["xao", "Khao"], ["xap", "Apalachee"], ["xaq", "Aquitanian"], ["xar", "Karami"], ["xas", "Kamas"], ["xat", "Katawixi"], ["xau", "Kauwera"], ["xav", "Xavánte"], ["xaw", "Kawaiisu"], ["xay", "Kayan Mahakam"], ["xba", "Kamba (Brazil)"], ["xbb", "Lower Burdekin"], ["xbc", "Bactrian"], ["xbd", "Bindal"], ["xbe", "Bigambal"], ["xbg", "Bunganditj"], ["xbi", "Kombio"], ["xbj", "Birrpayi"], ["xbm", "Middle Breton"], ["xbn", "Kenaboi"], ["xbo", "Bolgarian"], ["xbp", "Bibbulman"], ["xbr", "Kambera"], ["xbw", "Kambiwá"], ["xbx", "Kabixí"], ["xby", "Batjala, Batyala"], ["xcb", "Cumbric"], ["xcc", "Camunic"], ["xce", "Celtiberian"], ["xcg", "Cisalpine Gaulish"], ["xch", "Chemakum, Chimakum"], ["xcl", "Classical Armenian"], ["xcm", "Comecrudo"], ["xcn", "Cotoname"], ["xco", "Chorasmian"], ["xcr", "Carian"], ["xct", "Classical Tibetan"], ["xcu", "Curonian"], ["xcv", "Chuvantsy"], ["xcw", "Coahuilteco"], ["xcy", "Cayuse"], ["xda", "Darkinyung"], ["xdc", "Dacian"], ["xdk", "Dharuk"], ["xdm", "Edomite"], ["xdo", "Kwandu"], ["xdy", "Malayic Dayak"], ["xeb", "Eblan"], ["xed", "Hdi"], ["xeg", "ǁXegwi"], ["xel", "Kelo"], ["xem", "Kembayan"], ["xep", "Epi-Olmec"], ["xer", "Xerénte"], ["xes", "Kesawai"], ["xet", "Xetá"], ["xeu", "Keoru-Ahia"], ["xfa", "Faliscan"], ["xga", "Galatian"], ["xgb", "Gbin"], ["xgd", "Gudang"], ["xgf", "Gabrielino-Fernandeño"], ["xgg", "Goreng"], ["xgi", "Garingbal"], ["xgl", "Galindan"], ["xgm", "Dharumbal, Guwinmal"], ["xgn", "Mongolian languages"], ["xgr", "Garza"], ["xgu", "Unggumi"], ["xgw", "Guwa"], ["xha", "Harami"], ["xhc", "Hunnic"], ["xhd", "Hadrami"], ["xhe", "Khetrani"], ["xhr", "Hernican"], ["xht", "Hattic"], ["xhu", "Hurrian"], ["xhv", "Khua"], ["xia", "Xiandao"], ["xib", "Iberian"], ["xii", "Xiri"], ["xil", "Illyrian"], ["xin", "Xinca"], ["xip", "Xipináwa"], ["xir", "Xiriâna"], ["xis", "Kisan"], ["xiv", "Indus Valley Language"], ["xiy", "Xipaya"], ["xjb", "Minjungbal"], ["xjt", "Jaitmatang"], ["xka", "Kalkoti"], ["xkb", "Northern Nago"], ["xkc", "Kho'ini"], ["xkd", "Mendalam Kayan"], ["xke", "Kereho"], ["xkf", "Khengkha"], ["xkg", "Kagoro"], ["xkh", "Karahawyana"], ["xki", "Kenyan Sign Language"], ["xkj", "Kajali"], ["xkk", "Kaco'"], ["xkl", "Mainstream Kenyah"], ["xkn", "Kayan River Kayan"], ["xko", "Kiorr"], ["xkp", "Kabatei"], ["xkq", "Koroni"], ["xkr", "Xakriabá"], ["xks", "Kumbewaha"], ["xkt", "Kantosi"], ["xku", "Kaamba"], ["xkv", "Kgalagadi"], ["xkw", "Kembra"], ["xkx", "Karore"], ["xky", "Uma' Lasan"], ["xkz", "Kurtokha"], ["xla", "Kamula"], ["xlb", "Loup B"], ["xlc", "Lycian"], ["xld", "Lydian"], ["xle", "Lemnian"], ["xlg", "Ligurian (Ancient)"], ["xli", "Liburnian"], ["xln", "Alanic"], ["xlo", "Loup A"], ["xlp", "Lepontic"], ["xls", "Lusitanian"], ["xlu", "Cuneiform Luwian"], ["xly", "Elymian"], ["xma", "Mushungulu"], ["xmb", "Mbonga"], ["xmc", "Makhuwa-Marrevone"], ["xmd", "Mbudum"], ["xme", "Median"], ["xmf", "Mingrelian"], ["xmg", "Mengaka"], ["xmh", "Kugu-Muminh"], ["xmj", "Majera"], ["xmk", "Ancient Macedonian"], ["xml", "Malaysian Sign Language"], ["xmm", "Manado Malay"], ["xmn", "Manichaean Middle Persian"], ["xmo", "Morerebi"], ["xmp", "Kuku-Mu'inh"], ["xmq", "Kuku-Mangk"], ["xmr", "Meroitic"], ["xms", "Moroccan Sign Language"], ["xmt", "Matbat"], ["xmu", "Kamu"], ["xmv", "Antankarana Malagasy, Tankarana Malagasy"], ["xmw", "Tsimihety Malagasy"], ["xmx", "Maden"], ["xmy", "Mayaguduna"], ["xmz", "Mori Bawah"], ["xna", "Ancient North Arabian"], ["xnb", "Kanakanabu"], ["xnd", "Na-Dene languages"], ["xng", "Middle Mongolian"], ["xnh", "Kuanhua"], ["xni", "Ngarigu"], ["xnj", "Ngoni (Tanzania)"], ["xnk", "Nganakarti"], ["xnm", "Ngumbarl"], ["xnn", "Northern Kankanay"], ["xno", "Anglo-Norman"], ["xnq", "Ngoni (Mozambique)"], ["xnr", "Kangri"], ["xns", "Kanashi"], ["xnt", "Narragansett"], ["xnu", "Nukunul"], ["xny", "Nyiyaparli"], ["xnz", "Kenzi, Mattoki"], ["xoc", "O'chi'chi'"], ["xod", "Kokoda"], ["xog", "Soga"], ["xoi", "Kominimung"], ["xok", "Xokleng"], ["xom", "Komo (Sudan)"], ["xon", "Konkomba"], ["xoo", "Xukurú"], ["xop", "Kopar"], ["xor", "Korubo"], ["xow", "Kowaki"], ["xpa", "Pirriya"], ["xpb", "Northeastern Tasmanian, Pyemmairrener"], ["xpc", "Pecheneg"], ["xpd", "Oyster Bay Tasmanian"], ["xpe", "Liberia Kpelle"], ["xpf", "Southeast Tasmanian, Nuenonne"], ["xpg", "Phrygian"], ["xph", "North Midlands Tasmanian, Tyerrenoterpanner"], ["xpi", "Pictish"], ["xpj", "Mpalitjanh"], ["xpk", "Kulina Pano"], ["xpl", "Port Sorell Tasmanian"], ["xpm", "Pumpokol"], ["xpn", "Kapinawá"], ["xpo", "Pochutec"], ["xpp", "Puyo-Paekche"], ["xpq", "Mohegan-Pequot"], ["xpr", "Parthian"], ["xps", "Pisidian"], ["xpt", "Punthamara"], ["xpu", "Punic"], ["xpv", "Northern Tasmanian, Tommeginne"], ["xpw", "Northwestern Tasmanian, Peerapper"], ["xpx", "Southwestern Tasmanian, Toogee"], ["xpy", "Puyo"], ["xpz", "Bruny Island Tasmanian"], ["xqa", "Karakhanid"], ["xqt", "Qatabanian"], ["xra", "Krahô"], ["xrb", "Eastern Karaboro"], ["xrd", "Gundungurra"], ["xre", "Kreye"], ["xrg", "Minang"], ["xri", "Krikati-Timbira"], ["xrm", "Armazic"], ["xrn", "Arin"], ["xrq", "Karranga"], ["xrr", "Raetic"], ["xrt", "Aranama-Tamique"], ["xru", "Marriammu"], ["xrw", "Karawa"], ["xsa", "Sabaean"], ["xsb", "Sambal"], ["xsc", "Scythian"], ["xsd", "Sidetic"], ["xse", "Sempan"], ["xsh", "Shamang"], ["xsi", "Sio"], ["xsj", "Subi"], ["xsl", "South Slavey"], ["xsm", "Kasem"], ["xsn", "Sanga (Nigeria)"], ["xso", "Solano"], ["xsp", "Silopi"], ["xsq", "Makhuwa-Saka"], ["xsr", "Sherpa"], ["xss", "Assan"], ["xsu", "Sanumá"], ["xsv", "Sudovian"], ["xsy", "Saisiyat"], ["xta", "Alcozauca Mixtec"], ["xtb", "Chazumba Mixtec"], ["xtc", "Katcha-Kadugli-Miri"], ["xtd", "Diuxi-Tilantongo Mixtec"], ["xte", "Ketengban"], ["xtg", "Transalpine Gaulish"], ["xth", "Yitha Yitha"], ["xti", "Sinicahua Mixtec"], ["xtj", "San Juan Teita Mixtec"], ["xtl", "Tijaltepec Mixtec"], ["xtm", "Magdalena Peñasco Mixtec"], ["xtn", "Northern Tlaxiaco Mixtec"], ["xto", "Tokharian A"], ["xtp", "San Miguel Piedras Mixtec"], ["xtq", "Tumshuqese"], ["xtr", "Early Tripuri"], ["xts", "Sindihui Mixtec"], ["xtt", "Tacahua Mixtec"], ["xtu", "Cuyamecalco Mixtec"], ["xtv", "Thawa"], ["xtw", "Tawandê"], ["xty", "Yoloxochitl Mixtec"], ["xtz", "Tasmanian"], ["xua", "Alu Kurumba"], ["xub", "Betta Kurumba"], ["xud", "Umiida"], ["xug", "Kunigami"], ["xuj", "Jennu Kurumba"], ["xul", "Ngunawal, Nunukul"], ["xum", "Umbrian"], ["xun", "Unggaranggu"], ["xuo", "Kuo"], ["xup", "Upper Umpqua"], ["xur", "Urartian"], ["xut", "Kuthant"], ["xuu", "Kxoe, Khwedam"], ["xve", "Venetic"], ["xvi", "Kamviri"], ["xvn", "Vandalic"], ["xvo", "Volscian"], ["xvs", "Vestinian"], ["xwa", "Kwaza"], ["xwc", "Woccon"], ["xwd", "Wadi Wadi"], ["xwe", "Xwela Gbe"], ["xwg", "Kwegu"], ["xwj", "Wajuk"], ["xwk", "Wangkumara"], ["xwl", "Western Xwla Gbe"], ["xwo", "Written Oirat"], ["xwr", "Kwerba Mamberamo"], ["xwt", "Wotjobaluk"], ["xww", "Wemba Wemba"], ["xxb", "Boro (Ghana)"], ["xxk", "Ke'o"], ["xxm", "Minkin"], ["xxr", "Koropó"], ["xxt", "Tambora"], ["xya", "Yaygir"], ["xyb", "Yandjibara"], ["xyj", "Mayi-Yapi"], ["xyk", "Mayi-Kulan"], ["xyl", "Yalakalore"], ["xyt", "Mayi-Thakurti"], ["xyy", "Yorta Yorta"], ["xzh", "Zhang-Zhung"], ["xzm", "Zemgalian"], ["xzp", "Ancient Zapotec"], ["yaa", "Yaminahua"], ["yab", "Yuhup"], ["yac", "Pass Valley Yali"], ["yad", "Yagua"], ["yae", "Pumé"], ["yaf", "Yaka (Democratic Republic of Congo)"], ["yag", "Yámana"], ["yah", "Yazgulyam"], ["yai", "Yagnobi"], ["yaj", "Banda-Yangere"], ["yak", "Yakama"], ["yal", "Yalunka"], ["yam", "Yamba"], ["yan", "Mayangna"], ["yao", "Yao"], ["yap", "Yapese"], ["yaq", "Yaqui"], ["yar", "Yabarana"], ["yas", "Nugunu (Cameroon)"], ["yat", "Yambeta"], ["yau", "Yuwana"], ["yav", "Yangben"], ["yaw", "Yawalapití"], ["yax", "Yauma"], ["yay", "Agwagwune"], ["yaz", "Lokaa"], ["yba", "Yala"], ["ybb", "Yemba"], ["ybd", "Yangbye"], ["ybe", "West Yugur"], ["ybh", "Yakha"], ["ybi", "Yamphu"], ["ybj", "Hasha"], ["ybk", "Bokha"], ["ybl", "Yukuben"], ["ybm", "Yaben"], ["ybn", "Yabaâna"], ["ybo", "Yabong"], ["ybx", "Yawiyo"], ["yby", "Yaweyuha"], ["ych", "Chesu"], ["ycl", "Lolopo"], ["ycn", "Yucuna"], ["ycp", "Chepya"], ["yda", "Yanda"], ["ydd", "Eastern Yiddish"], ["yde", "Yangum Dey"], ["ydg", "Yidgha"], ["ydk", "Yoidik"], ["yds", "Yiddish Sign Language"], ["yea", "Ravula"], ["yec", "Yeniche"], ["yee", "Yimas"], ["yei", "Yeni"], ["yej", "Yevanic"], ["yel", "Yela"], ["yen", "Yendang"], ["yer", "Tarok"], ["yes", "Nyankpa"], ["yet", "Yetfa"], ["yeu", "Yerukula"], ["yev", "Yapunda"], ["yey", "Yeyi"], ["yga", "Malyangapa"], ["ygi", "Yiningayi"], ["ygl", "Yangum Gel"], ["ygm", "Yagomi"], ["ygp", "Gepo"], ["ygr", "Yagaria"], ["ygs", "Yolŋu Sign Language"], ["ygu", "Yugul"], ["ygw", "Yagwoia"], ["yha", "Baha Buyang"], ["yhd", "Judeo-Iraqi Arabic"], ["yhl", "Hlepho Phowa"], ["yhs", "Yan-nhaŋu Sign Language"], ["yia", "Yinggarda"], ["yif", "Ache"], ["yig", "Wusa Nasu"], ["yih", "Western Yiddish"], ["yii", "Yidiny"], ["yij", "Yindjibarndi"], ["yik", "Dongshanba Lalo"], ["yil", "Yindjilandji"], ["yim", "Yimchungru Naga"], ["yin", "Riang Lai, Yinchia"], ["yip", "Pholo"], ["yiq", "Miqie"], ["yir", "North Awyu"], ["yis", "Yis"], ["yit", "Eastern Lalu"], ["yiu", "Awu"], ["yiv", "Northern Nisu"], ["yix", "Axi Yi"], ["yiy", "Yir Yoront"], ["yiz", "Azhe"], ["yka", "Yakan"], ["ykg", "Northern Yukaghir"], ["yki", "Yoke"], ["ykk", "Yakaikeke"], ["ykl", "Khlula"], ["ykm", "Kap"], ["ykn", "Kua-nsi"], ["yko", "Yasa"], ["ykr", "Yekora"], ["ykt", "Kathu"], ["yku", "Kuamasi"], ["yky", "Yakoma"], ["yla", "Yaul"], ["ylb", "Yaleba"], ["yle", "Yele"], ["ylg", "Yelogu"], ["yli", "Angguruk Yali"], ["yll", "Yil"], ["ylm", "Limi"], ["yln", "Langnian Buyang"], ["ylo", "Naluo Yi"], ["ylr", "Yalarnnga"], ["ylu", "Aribwaung"], ["yly", "Nyâlayu, Nyelâyu"], ["yma", "Yamphe"], ["ymb", "Yambes"], ["ymc", "Southern Muji"], ["ymd", "Muda"], ["yme", "Yameo"], ["ymg", "Yamongeri"], ["ymh", "Mili"], ["ymi", "Moji"], ["ymk", "Makwe"], ["yml", "Iamalele"], ["ymm", "Maay"], ["ymn", "Yamna, Sunum"], ["ymo", "Yangum Mon"], ["ymp", "Yamap"], ["ymq", "Qila Muji"], ["ymr", "Malasar"], ["yms", "Mysian"], ["ymt", "Mator-Taygi-Karagas"], ["ymx", "Northern Muji"], ["ymz", "Muzi"], ["yna", "Aluo"], ["ynd", "Yandruwandha"], ["yne", "Lang'e"], ["yng", "Yango"], ["ynh", "Yangho"], ["ynk", "Naukan Yupik"], ["ynl", "Yangulam"], ["ynn", "Yana"], ["yno", "Yong"], ["ynq", "Yendang"], ["yns", "Yansi"], ["ynu", "Yahuna"], ["yob", "Yoba"], ["yog", "Yogad"], ["yoi", "Yonaguni"], ["yok", "Yokuts"], ["yol", "Yola"], ["yom", "Yombe"], ["yon", "Yongkom"], ["yos", "Yos"], ["yot", "Yotti"], ["yox", "Yoron"], ["yoy", "Yoy"], ["ypa", "Phala"], ["ypb", "Labo Phowa"], ["ypg", "Phola"], ["yph", "Phupha"], ["ypk", "Yupik languages"], ["ypm", "Phuma"], ["ypn", "Ani Phowa"], ["ypo", "Alo Phola"], ["ypp", "Phupa"], ["ypz", "Phuza"], ["yra", "Yerakai"], ["yrb", "Yareba"], ["yre", "Yaouré"], ["yri", "Yarí"], ["yrk", "Nenets"], ["yrl", "Nhengatu"], ["yrm", "Yirrk-Mel"], ["yrn", "Yerong"], ["yro", "Yaroamë"], ["yrs", "Yarsun"], ["yrw", "Yarawata"], ["yry", "Yarluyandi"], ["ysc", "Yassic"], ["ysd", "Samatao"], ["ysg", "Sonaga"], ["ysl", "Yugoslavian Sign Language"], ["ysm", "Myanmar Sign Language"], ["ysn", "Sani"], ["yso", "Nisi (China)"], ["ysp", "Southern Lolopo"], ["ysr", "Sirenik Yupik"], ["yss", "Yessan-Mayo"], ["ysy", "Sanie"], ["yta", "Talu"], ["ytl", "Tanglang"], ["ytp", "Thopho"], ["ytw", "Yout Wam"], ["yty", "Yatay"], ["yua", "Yucateco, Yucatec Maya"], ["yub", "Yugambal"], ["yuc", "Yuchi"], ["yud", "Judeo-Tripolitanian Arabic"], ["yue", "Yue Chinese, Cantonese"], ["yuf", "Havasupai-Walapai-Yavapai"], ["yug", "Yug"], ["yui", "Yurutí"], ["yuj", "Karkar-Yuri"], ["yuk", "Yuki"], ["yul", "Yulu"], ["yum", "Quechan"], ["yun", "Bena (Nigeria)"], ["yup", "Yukpa"], ["yuq", "Yuqui"], ["yur", "Yurok"], ["yut", "Yopno"], ["yuu", "Yugh"], ["yuw", "Yau (Morobe Province)"], ["yux", "Southern Yukaghir"], ["yuy", "East Yugur"], ["yuz", "Yuracare"], ["yva", "Yawa"], ["yvt", "Yavitero"], ["ywa", "Kalou"], ["ywg", "Yinhawangka"], ["ywl", "Western Lalu"], ["ywn", "Yawanawa"], ["ywq", "Wuding-Luquan Yi"], ["ywr", "Yawuru"], ["ywt", "Xishanba Lalo, Central Lalo"], ["ywu", "Wumeng Nasu"], ["yww", "Yawarawarga"], ["yxa", "Mayawali"], ["yxg", "Yagara"], ["yxl", "Yardliyawarra"], ["yxm", "Yinwum"], ["yxu", "Yuyu"], ["yxy", "Yabula Yabula"], ["yyr", "Yir Yoront"], ["yyu", "Yau (Sandaun Province)"], ["yyz", "Ayizi"], ["yzg", "E'ma Buyang"], ["yzk", "Zokhuo"], ["zaa", "Sierra de Juárez Zapotec"], ["zab", "Western Tlacolula Valley Zapotec, San Juan Guelavía Zapotec"], ["zac", "Ocotlán Zapotec"], ["zad", "Cajonos Zapotec"], ["zae", "Yareni Zapotec"], ["zaf", "Ayoquesco Zapotec"], ["zag", "Zaghawa"], ["zah", "Zangwal"], ["zai", "Isthmus Zapotec"], ["zaj", "Zaramo"], ["zak", "Zanaki"], ["zal", "Zauzou"], ["zam", "Miahuatlán Zapotec"], ["zao", "Ozolotepec Zapotec"], ["zap", "Zapotec"], ["zaq", "Aloápam Zapotec"], ["zar", "Rincón Zapotec"], ["zas", "Santo Domingo Albarradas Zapotec"], ["zat", "Tabaa Zapotec"], ["zau", "Zangskari"], ["zav", "Yatzachi Zapotec"], ["zaw", "Mitla Zapotec"], ["zax", "Xadani Zapotec"], ["zay", "Zayse-Zergulla, Zaysete"], ["zaz", "Zari"], ["zba", "Balaibalan"], ["zbc", "Central Berawan"], ["zbe", "East Berawan"], ["zbl", "Blissymbols, Bliss, Blissymbolics"], ["zbt", "Batui"], ["zbu", "Bu (Bauchi State)"], ["zbw", "West Berawan"], ["zca", "Coatecas Altas Zapotec"], ["zch", "Central Hongshuihe Zhuang"], ["zdj", "Ngazidja Comorian"], ["zea", "Zeeuws"], ["zeg", "Zenag"], ["zeh", "Eastern Hongshuihe Zhuang"], ["zen", "Zenaga"], ["zga", "Kinga"], ["zgb", "Guibei Zhuang"], ["zgh", "Standard Moroccan Tamazight"], ["zgm", "Minz Zhuang"], ["zgn", "Guibian Zhuang"], ["zgr", "Magori"], ["zhb", "Zhaba"], ["zhd", "Dai Zhuang"], ["zhi", "Zhire"], ["zhn", "Nong Zhuang"], ["zhw", "Zhoa"], ["zhx", "Chinese (family)"], ["zia", "Zia"], ["zib", "Zimbabwe Sign Language"], ["zik", "Zimakani"], ["zil", "Zialo"], ["zim", "Mesme"], ["zin", "Zinza"], ["zir", "Ziriya"], ["ziw", "Zigula"], ["ziz", "Zizilivakan"], ["zka", "Kaimbulawa"], ["zkb", "Koibal"], ["zkd", "Kadu"], ["zkg", "Koguryo"], ["zkh", "Khorezmian"], ["zkk", "Karankawa"], ["zkn", "Kanan"], ["zko", "Kott"], ["zkp", "São Paulo Kaingáng"], ["zkr", "Zakhring"], ["zkt", "Kitan"], ["zku", "Kaurna"], ["zkv", "Krevinian"], ["zkz", "Khazar"], ["zla", "Zula"], ["zle", "East Slavic languages"], ["zlj", "Liujiang Zhuang"], ["zlm", "Malay (individual language)"], ["zln", "Lianshan Zhuang"], ["zlq", "Liuqian Zhuang"], ["zls", "South Slavic languages"], ["zlw", "West Slavic languages"], ["zma", "Manda (Australia)"], ["zmb", "Zimba"], ["zmc", "Margany"], ["zmd", "Maridan"], ["zme", "Mangerr"], ["zmf", "Mfinu"], ["zmg", "Marti Ke"], ["zmh", "Makolkol"], ["zmi", "Negeri Sembilan Malay"], ["zmj", "Maridjabin"], ["zmk", "Mandandanyi"], ["zml", "Matngala"], ["zmm", "Marimanindji, Marramaninyshi"], ["zmn", "Mbangwe"], ["zmo", "Molo"], ["zmp", "Mpuono"], ["zmq", "Mituku"], ["zmr", "Maranunggu"], ["zms", "Mbesa"], ["zmt", "Maringarr"], ["zmu", "Muruwari"], ["zmv", "Mbariman-Gudhinma"], ["zmw", "Mbo (Democratic Republic of Congo)"], ["zmx", "Bomitaba"], ["zmy", "Mariyedi"], ["zmz", "Mbandja"], ["zna", "Zan Gula"], ["znd", "Zande languages"], ["zne", "Zande (individual language)"], ["zng", "Mang"], ["znk", "Manangkari"], ["zns", "Mangas"], ["zoc", "Copainalá Zoque"], ["zoh", "Chimalapa Zoque"], ["zom", "Zou"], ["zoo", "Asunción Mixtepec Zapotec"], ["zoq", "Tabasco Zoque"], ["zor", "Rayón Zoque"], ["zos", "Francisco León Zoque"], ["zpa", "Lachiguiri Zapotec"], ["zpb", "Yautepec Zapotec"], ["zpc", "Choapan Zapotec"], ["zpd", "Southeastern Ixtlán Zapotec"], ["zpe", "Petapa Zapotec"], ["zpf", "San Pedro Quiatoni Zapotec"], ["zpg", "Guevea De Humboldt Zapotec"], ["zph", "Totomachapan Zapotec"], ["zpi", "Santa María Quiegolani Zapotec"], ["zpj", "Quiavicuzas Zapotec"], ["zpk", "Tlacolulita Zapotec"], ["zpl", "Lachixío Zapotec"], ["zpm", "Mixtepec Zapotec"], ["zpn", "Santa Inés Yatzechi Zapotec"], ["zpo", "Amatlán Zapotec"], ["zpp", "El Alto Zapotec"], ["zpq", "Zoogocho Zapotec"], ["zpr", "Santiago Xanica Zapotec"], ["zps", "Coatlán Zapotec"], ["zpt", "San Vicente Coatlán Zapotec"], ["zpu", "Yalálag Zapotec"], ["zpv", "Chichicapan Zapotec"], ["zpw", "Zaniza Zapotec"], ["zpx", "San Baltazar Loxicha Zapotec"], ["zpy", "Mazaltepec Zapotec"], ["zpz", "Texmelucan Zapotec"], ["zqe", "Qiubei Zhuang"], ["zra", "Kara (Korea)"], ["zrg", "Mirgan"], ["zrn", "Zerenkel"], ["zro", "Záparo"], ["zrp", "Zarphatic"], ["zrs", "Mairasi"], ["zsa", "Sarasira"], ["zsk", "Kaskean"], ["zsl", "Zambian Sign Language"], ["zsm", "Standard Malay"], ["zsr", "Southern Rincon Zapotec"], ["zsu", "Sukurum"], ["zte", "Elotepec Zapotec"], ["ztg", "Xanaguía Zapotec"], ["ztl", "Lapaguía-Guivini Zapotec"], ["ztm", "San Agustín Mixtepec Zapotec"], ["ztn", "Santa Catarina Albarradas Zapotec"], ["ztp", "Loxicha Zapotec"], ["ztq", "Quioquitani-Quierí Zapotec"], ["zts", "Tilquiapan Zapotec"], ["ztt", "Tejalapan Zapotec"], ["ztu", "Güilá Zapotec"], ["ztx", "Zaachila Zapotec"], ["zty", "Yatee Zapotec"], ["zua", "Zeem"], ["zuh", "Tokano"], ["zum", "Kumzari"], ["zun", "Zuni"], ["zuy", "Zumaya"], ["zwa", "Zay"], ["zxx", "No linguistic content, Not applicable"], ["zyb", "Yongbei Zhuang"], ["zyg", "Yang Zhuang"], ["zyj", "Youjiang Zhuang"], ["zyn", "Yongnan Zhuang"], ["zyp", "Zyphe Chin"], ["zza", "Zaza, Dimili, Dimli (macrolanguage), Kirdki, Kirmanjki (macrolanguage), Zazaki"], ["zzj", "Zuojiang Zhuang"]];

    var getLanguageLabel = /*#__PURE__*/function () {
      var _ref = /*#__PURE__*/_asyncToGenerator(function* (langCode) {
        var langCodeParts = langCode.split('-');
        var testParts = [];
        var testers = [];

        for (var langCodePart of langCodeParts) {
          testParts.push(langCodePart);
          testers.push(testParts.join('-'));
        }

        testers.reverse();
        var languageLabel = '';

        var _loop = function _loop(tester) {
          if (!languageLabel) {
            var _languages$find$, _languages$find;

            languageLabel = (_languages$find$ = (_languages$find = languages.find(language => language[0].startsWith(tester))) == null ? void 0 : _languages$find[1]) != null ? _languages$find$ : '';
          }
        };

        for (var tester of testers) {
          _loop(tester);
        }

        var scriptMapping = {
          'latn': t.direct('Latin').toString(),
          'cyrl': t.direct('Cyrillic').toString()
        };
        var hasScript = '';

        var _loop2 = function _loop2(script) {
          if (langCodeParts.some(item => item.toLowerCase() === script)) {
            hasScript = "" + scriptMapping[script.toLowerCase()];
          }
        };

        for (var script of Object.keys(scriptMapping)) {
          _loop2(script);
        }

        return (languageLabel + " " + hasScript).trim();
      });

      return function getLanguageLabel(_x) {
        return _ref.apply(this, arguments);
      };
    }();
    var filterLanguages = /*#__PURE__*/function () {
      var _ref2 = /*#__PURE__*/_asyncToGenerator(function* (search) {
        if (!search) return [];
        return languages.filter(language => language[1].toLowerCase().includes(search.toLowerCase()));
      });

      return function filterLanguages(_x2) {
        return _ref2.apply(this, arguments);
      };
    }();
    var langCodesToObject = /*#__PURE__*/function () {
      var _ref3 = /*#__PURE__*/_asyncToGenerator(function* (langCodes) {
        var languages = {};

        for (var langCode of langCodes) {
          languages[langCode] = yield getLanguageLabel(langCode);
        }

        return languages;
      });

      return function langCodesToObject(_x3) {
        return _ref3.apply(this, arguments);
      };
    }();
    var currentUiLanguage = 'en';
    var currentL10nLanguage;
    var uiLanguages = {
      'en': 'English'
    };
    var l10nLanguages = {
      'en': 'English'
    };
    var requiredL10nLanguages = [];
    class LanguageService extends EventTarget {
      constructor() {
        super();
        this.ready = false;
      }

      init(rdfForm) {
        var _this = this;

        return _asyncToGenerator(function* () {
          yield _this.setUiLanguage('en');

          _this.dispatchEvent(new CustomEvent('indexing-languages', {
            detail: {
              languages
            }
          }));

          var continueInit = /*#__PURE__*/function () {
            var _ref4 = _asyncToGenerator(function* () {
              var _JSON$parse, _JSON$parse2, _rdfForm$getAttribute;

              var usedLanguages = yield _this.extractUsedLanguages(rdfForm.formData.proxy);
              var defaultLanguages = (_JSON$parse = JSON.parse(rdfForm.getAttribute('languages'))) != null ? _JSON$parse : usedLanguages.length ? yield langCodesToObject(usedLanguages) : {};
              var parsedLanguages = JSON.parse(rdfForm.getAttribute('l10n-languages'));
              _this.l10nLanguages = Object.assign({}, parsedLanguages, defaultLanguages);

              if (rdfForm.getAttribute('required-l10n-languages')) {
                requiredL10nLanguages = rdfForm.getAttribute('required-l10n-languages').split(',');
              }

              if (rdfForm.getAttribute('selected-l10n-language') && rdfForm.getAttribute('selected-l10n-language').toLowerCase() in _this.l10nLanguages) {
                _this.l10nLanguage = rdfForm.getAttribute('selected-l10n-language').toLowerCase();
              }

              _this.uiLanguages = (_JSON$parse2 = JSON.parse(rdfForm.getAttribute('ui-languages'))) != null ? _JSON$parse2 : {};
              yield _this.setUiLanguage((_rdfForm$getAttribute = rdfForm.getAttribute('selected-language')) != null ? _rdfForm$getAttribute : 'en');
              _this.ready = true;

              _this.dispatchEvent(new CustomEvent('ready'));
            });

            return function continueInit() {
              return _ref4.apply(this, arguments);
            };
          }();

          rdfForm.formData.ready ? continueInit() : rdfForm.formData.addEventListener('ready', continueInit, {
            once: true
          });
        })();
      }

      get requiredL10nLanguages() {
        return requiredL10nLanguages;
      }

      get uiLanguage() {
        return currentUiLanguage;
      }

      setUiLanguage(languageCode) {
        var _this2 = this;

        return _asyncToGenerator(function* () {
          currentUiLanguage = languageCode;
          t = yield I18n(languageCode, 'RdfForm', Object.keys(_this2.uiLanguages), 'en');

          _this2.dispatchEvent(new CustomEvent('language-change'));
        })();
      }

      set l10nLanguage(langCode) {
        currentL10nLanguage = langCode;
        this.dispatchEvent(new CustomEvent('l10n-change', {
          detail: langCode
        }));
      }

      get l10nLanguage() {
        return currentL10nLanguage;
      }

      set l10nLanguages(languages) {
        var oldLanguageCodes = Object.keys(l10nLanguages);
        var newLanguageCodes = Object.keys(languages);
        var languageCodesToAdd = newLanguageCodes.filter(x => !oldLanguageCodes.includes(x));
        var languageCodesToDelete = oldLanguageCodes.filter(x => !newLanguageCodes.includes(x));

        if (languageCodesToDelete.includes(currentL10nLanguage)) {
          currentL10nLanguage = newLanguageCodes[0];
        }

        for (var langCode of languageCodesToAdd) {
          this.dispatchEvent(new CustomEvent('this.added', {
            detail: langCode
          }));
        }

        for (var _langCode of languageCodesToDelete) {
          this.dispatchEvent(new CustomEvent('this.removed', {
            detail: _langCode
          }));
        }

        l10nLanguages = languages;

        if (!currentL10nLanguage) {
          currentL10nLanguage = Object.keys(l10nLanguages)[0];
        }
      }

      get l10nLanguages() {
        return l10nLanguages;
      }

      set uiLanguages(languages) {
        uiLanguages = languages;
      }

      get uiLanguages() {
        return uiLanguages;
      }

      multilingualValue(values, type) {
        var _ref5, _ref6, _currentLanguageMatch;

        if (type === void 0) {
          type = 'ui';
        }

        if (!Array.isArray(values)) values = [values];
        var currentLanguageMatch = values.find(value => value['@language'] === (type === 'ui' ? this.uiLanguage : this.l10nLanguage));
        var fallbackNoLanguageMatch = values.find(value => !value['@language']);
        return (_ref5 = (_ref6 = (_currentLanguageMatch = currentLanguageMatch == null ? void 0 : currentLanguageMatch['@value']) != null ? _currentLanguageMatch : fallbackNoLanguageMatch == null ? void 0 : fallbackNoLanguageMatch['@value']) != null ? _ref6 : currentLanguageMatch == null ? void 0 : currentLanguageMatch['@id']) != null ? _ref5 : fallbackNoLanguageMatch == null ? void 0 : fallbackNoLanguageMatch['@id'];
      }

      extractUsedLanguages(jsonLd) {
        var languageCodes = new Set();

        var process = thing => {
          if (!thing) return;
          var iterateble = Array.isArray(thing) ? thing.entries() : Object.entries(thing);

          for (var [key, value] of iterateble) {
            if (key === '@language') languageCodes.add(value);
            if (typeof value !== 'string') process(value);
          }
        };

        process(jsonLd);
        return [...languageCodes.values()];
      }

    }
    var Language = /*#__PURE__*/new LanguageService();
    var t;

    var applyProxy = function applyProxy(url, proxy) {
      if (proxy === void 0) {
        proxy = null;
      }

      url = url.replace('http:', location.protocol);
      if (proxy && !url.startsWith('/') && !url.startsWith('blob')) url = proxy + url;
      return url;
    };

    var only = function only() {
      for (var _len = arguments.length, type = new Array(_len), _key = 0; _key < _len; _key++) {
        type[_key] = arguments[_key];
      }

      return item => {
        var _item$Type;

        return (_item$Type = item['@type']) == null ? void 0 : _item$Type.some(rdfClass => type.includes(lastPart(rdfClass)));
      };
    };
    class FormDefinition extends EventTarget {
      constructor(form) {
        super();
        this.sourceDefinitionCompacted = {};
        this.context = {
          form: null
        };
        this.ready = false;
        this.chain = new Map();
        this.chainReferences = new Map();
        this.ontology = [];
        this.form = form;
        this.formUrl = this.form.getAttribute('form');
        if (!this.formUrl) throw new Error('No data attribute "form" was found on the custom element.');
        this.init();
      }

      init() {
        var _this = this;

        return _asyncToGenerator(function* () {
          var _this$form$getAttribu;

          var proxy = (_this$form$getAttribu = _this.form.getAttribute('proxy')) != null ? _this$form$getAttribu : '';
          _this.roles = _this.form.getAttribute('roles') ? _this.form.getAttribute('roles').split(',') : [];
          var definitionResponse = yield fetch(applyProxy(_this.formUrl, proxy));
          var definitionTurtle = yield definitionResponse.text();
          _this.sourceDefinitionCompacted = ttl2jsonld(definitionTurtle);
          Object.assign(_this.context, _this.sourceDefinitionCompacted['@context']);
          if (!_this.context.form) throw new Error('The prefix form was not found in the form definition.');
          if (!_this.sourceDefinitionCompacted['@graph']) throw new Error('Missing fields inside form definition');
          _this.sourceDefinitionExpanded = JsonLdProxy(yield jsonld.expand(_this.sourceDefinitionCompacted), _this.context, {
            '_': value => Language.multilingualValue(value, 'ui')
          });
          yield _this.resolveSubForms(_this.sourceDefinitionExpanded);
          if (!_this.info) throw new Error('The form definition did not define a form itself.');
          var ontologyCompacted = yield fetch(applyProxy(_this.context.form, proxy)).then( /*#__PURE__*/function () {
            var _ref = _asyncToGenerator(function* (response) {
              return ttl2jsonld(yield response.text());
            });

            return function (_x) {
              return _ref.apply(this, arguments);
            };
          }());
          Object.assign(_this.context, ontologyCompacted['@context']);
          _this.ontology = JsonLdProxy(yield jsonld.expand(ontologyCompacted), _this.context);
          _this.chain = _this.createChain();
          _this.ready = true;

          _this.dispatchEvent(new CustomEvent('ready'));
        })();
      }

      get prefix() {
        return this.context.form;
      }

      get info() {
        return this.sourceDefinitionExpanded.find(only('Form'));
      }

      get fieldsToRemove() {
        var _this$form$getAttribu2, _map, _this$info$formRemov, _this$info$formRemov2;

        var formRemovals = JSON.parse((_this$form$getAttribu2 = this.form.getAttribute('fields-to-remove')) != null ? _this$form$getAttribu2 : '[]');
        return (_map = [...((_this$info$formRemov = (_this$info$formRemov2 = this.info['form:remove']) == null ? void 0 : _this$info$formRemov2.map(item => item._)) != null ? _this$info$formRemov : []), ...formRemovals].map(collapsed => expand(collapsed, this.context))) != null ? _map : [];
      }

      get fields() {
        return this.sourceDefinitionExpanded.filter(only('Field')).filter(field => !this.fieldsToRemove.includes(field['@id']));
      }

      get elements() {
        return this.sourceDefinitionExpanded.filter(only('Field', 'Container', 'UiComponent')).filter(field => !this.fieldsToRemove.includes(field['@id']));
      }

      resolveSubForms(formDefinition) {
        var _this2 = this;

        return _asyncToGenerator(function* () {
          var _this2$form$getAttrib;

          var proxy = (_this2$form$getAttrib = _this2.form.getAttribute('proxy')) != null ? _this2$form$getAttrib : '';
          var fields = formDefinition.filter(only('Field'));

          for (var field of fields) {
            var subformUrl = field['form:subform'];
            if ((subformUrl == null ? void 0 : subformUrl.length) > 1) throw new Error('Multiple sub forms were found for one field.');

            if (subformUrl) {
              var subformResponse = yield fetch(applyProxy(subformUrl._, proxy));
              var subformTurtle = yield subformResponse.text();
              var subformDefinitionCompacted = ttl2jsonld(subformTurtle);
              var subformDefinitionExpanded = JsonLdProxy(yield jsonld.expand(subformDefinitionCompacted), subformDefinitionCompacted['@context'], {
                '_': value => Language.multilingualValue(value, 'ui')
              });
              yield _this2.resolveSubForms(subformDefinitionExpanded);
              Object.assign(_this2.context, subformDefinitionCompacted['@context']);

              for (var subFormfield of subformDefinitionExpanded) {
                var _field$formOrder;

                if (field['form:container']) {
                  subFormfield['form:container'] = field['form:container'].$;
                }

                if ((_field$formOrder = field['form:order']) != null && _field$formOrder._) {
                  var _field$formOrder$_, _field$formOrder2, _subFormfield$formOr;

                  subFormfield['form:order'] = [{
                    '@value': ((_field$formOrder$_ = (_field$formOrder2 = field['form:order']) == null ? void 0 : _field$formOrder2._) != null ? _field$formOrder$_ : 0) + parseFloat('0.' + ((_subFormfield$formOr = subFormfield['form:order']) == null ? void 0 : _subFormfield$formOr._))
                  }];
                }
              }

              var fieldIndex = formDefinition.map(field => field.$).indexOf(field.$);
              formDefinition.$.splice(fieldIndex, 1, ...subformDefinitionExpanded.map(field => field.$));
            }
          }

          return formDefinition;
        })();
      }

      applyFieldAccessRoles(fields) {
        return fields.filter(field => {
          if (field['form:access']) {
            return this.roles.some(userRole => field['form:access'].map(role => role['@id']).includes(userRole));
          }

          return true;
        });
      }

      createChain() {
        var _this3 = this;

        var recursiveChainCreator = fields => {
          var chain = new Map();
          fields.sort((a, b) => {
            var _a$formOrder$_, _a$formOrder, _b$formOrder$_, _b$formOrder;

            return ((_a$formOrder$_ = (_a$formOrder = a['form:order']) == null ? void 0 : _a$formOrder._) != null ? _a$formOrder$_ : 0) - ((_b$formOrder$_ = (_b$formOrder = b['form:order']) == null ? void 0 : _b$formOrder._) != null ? _b$formOrder$_ : 0);
          });

          var _loop = function _loop(field) {
            var _field$formWidget;

            var fieldBindings = _this3.getBindingsOfField(field);

            var children = [];

            if (((_field$formWidget = field['form:widget']) == null ? void 0 : _field$formWidget._) === 'group' || lastPart(field['@type'][0]) === 'Container') {
              var _field$formWidget2;

              var nestingType = ((_field$formWidget2 = field['form:widget']) == null ? void 0 : _field$formWidget2._) === 'group' ? 'group' : 'container';
              children = _this3.applyFieldAccessRoles(_this3.elements.filter(innerField => {
                var _innerField$;

                return (innerField == null ? void 0 : (_innerField$ = innerField["form:" + nestingType]) == null ? void 0 : _innerField$._) === lastPart(field['@id']);
              }));
            }

            chain.set(fieldBindings.length ? fieldBindings : field.$, [field, recursiveChainCreator(children)]);
          };

          for (var field of fields) {
            _loop(field);
          }

          return chain;
        };

        var firstLevelFields = this.applyFieldAccessRoles(this.elements.filter(field => !field['form:group'] && !field['form:container']));
        return recursiveChainCreator(firstLevelFields);
      }

      getBindingsOfField(field) {
        var _this4 = this;

        var bindings = [];

        var _loop2 = function _loop2(fieldProperty, propertySetting) {
          var fieldMetaProperties = _this4.ontology.find(predicate => lastPart(predicate == null ? void 0 : predicate['@id']) === lastPart(fieldProperty));

          if (fieldMetaProperties && fieldMetaProperties['form:isBindingProperty'] && Array.isArray(propertySetting)) {
            bindings.push(...propertySetting.$.flatMap(item => item['@id']));
          }
        };

        for (var [fieldProperty, propertySetting] of Object.entries(field)) {
          _loop2(fieldProperty, propertySetting);
        }

        return bindings;
      }

    }

    var isFetchable = string => {
      return string.startsWith('http') || string.startsWith('blob') || string.substr(0, 1) === '/';
    };

    class RdfFormData extends EventTarget {
      constructor(form) {
        super();
        this.ready = false;
        this.proxy = {
          $: null
        };
        this.form = form;
        this.formDefinition = this.form.formDefinition;
        this.dataAsTextOrUrl = this.form.getAttribute('data');
        this.formDefinition.addEventListener('ready', () => this.init(), {
          once: true
        });
      }

      init() {
        var _this = this;

        return _asyncToGenerator(function* () {
          var _this$form$getAttribu, _this$sourceData;

          var proxy = (_this$form$getAttribu = _this.form.getAttribute('proxy')) != null ? _this$form$getAttribu : '';
          var dataText;
          if (!_this.dataAsTextOrUrl) _this.sourceData = [];

          if (_this.dataAsTextOrUrl && isFetchable(_this.dataAsTextOrUrl)) {
            var dataResponse = yield fetch(applyProxy(_this.dataAsTextOrUrl, proxy));
            dataText = yield dataResponse.text();
          } else {
            dataText = _this.dataAsTextOrUrl;
          }

          try {
            _this.sourceDataCompacted = JSON.parse(dataText);
          } catch (e) {
            _this.sourceDataCompacted = ttl2jsonld(dataText);
          }

          _this.sourceData = yield jsonld.expand(_this.sourceDataCompacted);
          if (Array.isArray(_this.sourceData)) _this.sourceData = _this.sourceData.pop();
          if (!_this.sourceData) _this.sourceData = {};
          if (!((_this$sourceData = _this.sourceData) != null && _this$sourceData['@type'])) _this.sourceData['@type'] = _this.formDefinition.info['form:binding'].map(rdfClass => rdfClass['@id']);

          _this.createProxy();

          _this.ready = true;

          _this.dispatchEvent(new CustomEvent('ready'));
        })();
      }

      get context() {
        var _this$sourceDataCompa;

        return Object.assign({}, this.formDefinition.context, (_this$sourceDataCompa = this.sourceDataCompacted) == null ? void 0 : _this$sourceDataCompa['@context']);
      }

      createProxy() {
        var context = this.context;
        this.proxy = JsonLdProxy(this.sourceData, context, {
          '_': value => Language.multilingualValue(value, 'l10n')
        });
      }

    }

    var faPencilAlt = {
      prefix: 'fas',
      iconName: 'pencil-alt',
      icon: [512, 512, [], "f303", "M497.9 142.1l-46.1 46.1c-4.7 4.7-12.3 4.7-17 0l-111-111c-4.7-4.7-4.7-12.3 0-17l46.1-46.1c18.7-18.7 49.1-18.7 67.9 0l60.1 60.1c18.8 18.7 18.8 49.1 0 67.9zM284.2 99.8L21.6 362.4.4 483.9c-2.9 16.4 11.4 30.6 27.8 27.8l121.5-21.3 262.6-262.6c4.7-4.7 4.7-12.3 0-17l-111-111c-4.8-4.7-12.4-4.7-17.1 0zM124.1 339.9c-5.5-5.5-5.5-14.3 0-19.8l154-154c5.5-5.5 14.3-5.5 19.8 0s5.5 14.3 0 19.8l-154 154c-5.5 5.5-14.3 5.5-19.8 0zM88 424h48v36.3l-64.5 11.3-31.1-31.1L51.7 376H88v48z"]
    };
    var faCheck = {
      prefix: 'fas',
      iconName: 'check',
      icon: [512, 512, [], "f00c", "M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z"]
    };
    var faReply = {
      prefix: 'fas',
      iconName: 'reply',
      icon: [512, 512, [], "f3e5", "M8.309 189.836L184.313 37.851C199.719 24.546 224 35.347 224 56.015v80.053c160.629 1.839 288 34.032 288 186.258 0 61.441-39.581 122.309-83.333 154.132-13.653 9.931-33.111-2.533-28.077-18.631 45.344-145.012-21.507-183.51-176.59-185.742V360c0 20.7-24.3 31.453-39.687 18.164l-176.004-152c-11.071-9.562-11.086-26.753 0-36.328z"]
    };
    var faTimes = {
      prefix: 'fas',
      iconName: 'times',
      icon: [352, 512, [], "f00d", "M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"]
    };
    var faPlus = {
      prefix: 'fas',
      iconName: 'plus',
      icon: [448, 512, [], "f067", "M416 208H272V64c0-17.67-14.33-32-32-32h-32c-17.67 0-32 14.33-32 32v144H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h144v144c0 17.67 14.33 32 32 32h32c17.67 0 32-14.33 32-32V304h144c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z"]
    };
    var faLanguage = {
      prefix: 'fas',
      iconName: 'language',
      icon: [640, 512, [], "f1ab", "M152.1 236.2c-3.5-12.1-7.8-33.2-7.8-33.2h-.5s-4.3 21.1-7.8 33.2l-11.1 37.5H163zM616 96H336v320h280c13.3 0 24-10.7 24-24V120c0-13.3-10.7-24-24-24zm-24 120c0 6.6-5.4 12-12 12h-11.4c-6.9 23.6-21.7 47.4-42.7 69.9 8.4 6.4 17.1 12.5 26.1 18 5.5 3.4 7.3 10.5 4.1 16.2l-7.9 13.9c-3.4 5.9-10.9 7.8-16.7 4.3-12.6-7.8-24.5-16.1-35.4-24.9-10.9 8.7-22.7 17.1-35.4 24.9-5.8 3.5-13.3 1.6-16.7-4.3l-7.9-13.9c-3.2-5.6-1.4-12.8 4.2-16.2 9.3-5.7 18-11.7 26.1-18-7.9-8.4-14.9-17-21-25.7-4-5.7-2.2-13.6 3.7-17.1l6.5-3.9 7.3-4.3c5.4-3.2 12.4-1.7 16 3.4 5 7 10.8 14 17.4 20.9 13.5-14.2 23.8-28.9 30-43.2H412c-6.6 0-12-5.4-12-12v-16c0-6.6 5.4-12 12-12h64v-16c0-6.6 5.4-12 12-12h16c6.6 0 12 5.4 12 12v16h64c6.6 0 12 5.4 12 12zM0 120v272c0 13.3 10.7 24 24 24h280V96H24c-13.3 0-24 10.7-24 24zm58.9 216.1L116.4 167c1.7-4.9 6.2-8.1 11.4-8.1h32.5c5.1 0 9.7 3.3 11.4 8.1l57.5 169.1c2.6 7.8-3.1 15.9-11.4 15.9h-22.9a12 12 0 0 1-11.5-8.6l-9.4-31.9h-60.2l-9.1 31.8c-1.5 5.1-6.2 8.7-11.5 8.7H70.3c-8.2 0-14-8.1-11.4-15.9z"]
    };
    var faGlobe = {
      prefix: 'fas',
      iconName: 'globe',
      icon: [496, 512, [], "f0ac", "M336.5 160C322 70.7 287.8 8 248 8s-74 62.7-88.5 152h177zM152 256c0 22.2 1.2 43.5 3.3 64h185.3c2.1-20.5 3.3-41.8 3.3-64s-1.2-43.5-3.3-64H155.3c-2.1 20.5-3.3 41.8-3.3 64zm324.7-96c-28.6-67.9-86.5-120.4-158-141.6 24.4 33.8 41.2 84.7 50 141.6h108zM177.2 18.4C105.8 39.6 47.8 92.1 19.3 160h108c8.7-56.9 25.5-107.8 49.9-141.6zM487.4 192H372.7c2.1 21 3.3 42.5 3.3 64s-1.2 43-3.3 64h114.6c5.5-20.5 8.6-41.8 8.6-64s-3.1-43.5-8.5-64zM120 256c0-21.5 1.2-43 3.3-64H8.6C3.2 212.5 0 233.8 0 256s3.2 43.5 8.6 64h114.6c-2-21-3.2-42.5-3.2-64zm39.5 96c14.5 89.3 48.7 152 88.5 152s74-62.7 88.5-152h-177zm159.3 141.6c71.4-21.2 129.4-73.7 158-141.6h-108c-8.8 56.9-25.6 107.8-50 141.6zM19.3 352c28.6 67.9 86.5 120.4 158 141.6-24.4-33.8-41.2-84.7-50-141.6h-108z"]
    };

    var kebabize = str => {
      if (str.split('').every(letter => letter.toUpperCase() === letter)) return str.toLowerCase();
      return str.split('').map((letter, index) => {
        return letter.toUpperCase() === letter ? "" + (index !== 0 ? '-' : '') + letter.toLowerCase() : letter;
      }).join('');
    };

    var attributesDiff = function attributesDiff(attributes, callback) {
      if (callback === void 0) {
        callback = null;
      }

      return node => {
        for (var key of Object.keys(attributes)) {
          if (attributes[key]) {
            var attributeValue = Array.isArray(attributes[key]) ? attributes[key].join(' ') : attributes[key];
            if (typeof attributeValue !== 'string' || attributeValue.trim()) node.setAttribute(key, attributeValue);
          } else {
            node.removeAttribute(key);
          }
        }

        if (callback) {
          callback(node);
          callback = null;
        }
      };
    };

    /*!
     * Font Awesome Free 5.15.1 by @fontawesome - https://fontawesome.com
     * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
     */
    function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
      }
    }

    function _defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    function _createClass(Constructor, protoProps, staticProps) {
      if (protoProps) _defineProperties(Constructor.prototype, protoProps);
      if (staticProps) _defineProperties(Constructor, staticProps);
      return Constructor;
    }

    function _defineProperty(obj, key, value) {
      if (key in obj) {
        Object.defineProperty(obj, key, {
          value: value,
          enumerable: true,
          configurable: true,
          writable: true
        });
      } else {
        obj[key] = value;
      }

      return obj;
    }

    function _objectSpread(target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);

        if (typeof Object.getOwnPropertySymbols === 'function') {
          ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) {
            return Object.getOwnPropertyDescriptor(source, sym).enumerable;
          }));
        }

        ownKeys.forEach(function (key) {
          _defineProperty(target, key, source[key]);
        });
      }

      return target;
    }

    function _slicedToArray(arr, i) {
      return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest();
    }

    function _arrayWithHoles(arr) {
      if (Array.isArray(arr)) return arr;
    }

    function _iterableToArrayLimit(arr, i) {
      var _arr = [];
      var _n = true;
      var _d = false;
      var _e = undefined;

      try {
        for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
          _arr.push(_s.value);

          if (i && _arr.length === i) break;
        }
      } catch (err) {
        _d = true;
        _e = err;
      } finally {
        try {
          if (!_n && _i["return"] != null) _i["return"]();
        } finally {
          if (_d) throw _e;
        }
      }

      return _arr;
    }

    function _nonIterableRest() {
      throw new TypeError("Invalid attempt to destructure non-iterable instance");
    }

    var noop = function noop() {};

    var _WINDOW = {};
    var _DOCUMENT = {};
    var _MUTATION_OBSERVER = null;
    var _PERFORMANCE = {
      mark: noop,
      measure: noop
    };

    try {
      if (typeof window !== 'undefined') _WINDOW = window;
      if (typeof document !== 'undefined') _DOCUMENT = document;
      if (typeof MutationObserver !== 'undefined') _MUTATION_OBSERVER = MutationObserver;
      if (typeof performance !== 'undefined') _PERFORMANCE = performance;
    } catch (e) {}

    var WINDOW = _WINDOW;
    var DOCUMENT = _DOCUMENT;
    var IS_DOM = !!DOCUMENT.documentElement && !!DOCUMENT.head && typeof DOCUMENT.addEventListener === 'function' && typeof DOCUMENT.createElement === 'function';
    var NAMESPACE_IDENTIFIER = '___FONT_AWESOME___';
    var DEFAULT_FAMILY_PREFIX = 'fa';
    var DEFAULT_REPLACEMENT_CLASS = 'svg-inline--fa';
    var DATA_FA_I2SVG = 'data-fa-i2svg';

    var DUOTONE_CLASSES = {
      GROUP: 'group',
      SWAP_OPACITY: 'swap-opacity',
      PRIMARY: 'primary',
      SECONDARY: 'secondary'
    };
    var initial = WINDOW.FontAwesomeConfig || {};

    function getAttrConfig(attr) {
      var element = DOCUMENT.querySelector('script[' + attr + ']');

      if (element) {
        return element.getAttribute(attr);
      }
    }

    function coerce(val) {
      // Getting an empty string will occur if the attribute is set on the HTML tag but without a value
      // We'll assume that this is an indication that it should be toggled to true
      // For example <script data-search-pseudo-elements src="..."></script>
      if (val === '') return true;
      if (val === 'false') return false;
      if (val === 'true') return true;
      return val;
    }

    if (DOCUMENT && typeof DOCUMENT.querySelector === 'function') {
      var attrs = [['data-family-prefix', 'familyPrefix'], ['data-replacement-class', 'replacementClass'], ['data-auto-replace-svg', 'autoReplaceSvg'], ['data-auto-add-css', 'autoAddCss'], ['data-auto-a11y', 'autoA11y'], ['data-search-pseudo-elements', 'searchPseudoElements'], ['data-observe-mutations', 'observeMutations'], ['data-mutate-approach', 'mutateApproach'], ['data-keep-original-source', 'keepOriginalSource'], ['data-measure-performance', 'measurePerformance'], ['data-show-missing-icons', 'showMissingIcons']];
      attrs.forEach(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2),
            attr = _ref2[0],
            key = _ref2[1];

        var val = coerce(getAttrConfig(attr));

        if (val !== undefined && val !== null) {
          initial[key] = val;
        }
      });
    }

    var _default = {
      familyPrefix: DEFAULT_FAMILY_PREFIX,
      replacementClass: DEFAULT_REPLACEMENT_CLASS,
      autoReplaceSvg: true,
      autoAddCss: true,
      autoA11y: true,
      searchPseudoElements: false,
      observeMutations: true,
      mutateApproach: 'async',
      keepOriginalSource: true,
      measurePerformance: false,
      showMissingIcons: true
    };

    var _config = /*#__PURE__*/_objectSpread({}, _default, initial);

    if (!_config.autoReplaceSvg) _config.observeMutations = false;

    var config = /*#__PURE__*/_objectSpread({}, _config);

    WINDOW.FontAwesomeConfig = config;
    var w = WINDOW || {};
    if (!w[NAMESPACE_IDENTIFIER]) w[NAMESPACE_IDENTIFIER] = {};
    if (!w[NAMESPACE_IDENTIFIER].styles) w[NAMESPACE_IDENTIFIER].styles = {};
    if (!w[NAMESPACE_IDENTIFIER].hooks) w[NAMESPACE_IDENTIFIER].hooks = {};
    if (!w[NAMESPACE_IDENTIFIER].shims) w[NAMESPACE_IDENTIFIER].shims = [];
    var namespace = w[NAMESPACE_IDENTIFIER];
    var functions = [];

    var listener = function listener() {
      DOCUMENT.removeEventListener('DOMContentLoaded', listener);
      loaded = 1;
      functions.map(function (fn) {
        return fn();
      });
    };

    var loaded = false;

    if (IS_DOM) {
      loaded = /*#__PURE__*/(DOCUMENT.documentElement.doScroll ? /^loaded|^c/ : /^loaded|^i|^c/).test(DOCUMENT.readyState);
      if (!loaded) DOCUMENT.addEventListener('DOMContentLoaded', listener);
    }
    typeof setImmediate === 'undefined' ? setTimeout : setImmediate;
    var meaninglessTransform = {
      size: 16,
      x: 0,
      y: 0,
      rotate: 0,
      flipX: false,
      flipY: false
    };

    function insertCss(css) {
      if (!css || !IS_DOM) {
        return;
      }

      var style = DOCUMENT.createElement('style');
      style.setAttribute('type', 'text/css');
      style.innerHTML = css;
      var headChildren = DOCUMENT.head.childNodes;
      var beforeChild = null;

      for (var i = headChildren.length - 1; i > -1; i--) {
        var child = headChildren[i];
        var tagName = (child.tagName || '').toUpperCase();

        if (['STYLE', 'LINK'].indexOf(tagName) > -1) {
          beforeChild = child;
        }
      }

      DOCUMENT.head.insertBefore(style, beforeChild);
      return css;
    }

    var idPool = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

    function nextUniqueId() {
      var size = 12;
      var id = '';

      while (size-- > 0) {
        id += idPool[Math.random() * 62 | 0];
      }

      return id;
    }

    function htmlEscape(str) {
      return "".concat(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function joinAttributes(attributes) {
      return Object.keys(attributes || {}).reduce(function (acc, attributeName) {
        return acc + "".concat(attributeName, "=\"").concat(htmlEscape(attributes[attributeName]), "\" ");
      }, '').trim();
    }

    function joinStyles(styles) {
      return Object.keys(styles || {}).reduce(function (acc, styleName) {
        return acc + "".concat(styleName, ": ").concat(styles[styleName], ";");
      }, '');
    }

    function transformIsMeaningful(transform) {
      return transform.size !== meaninglessTransform.size || transform.x !== meaninglessTransform.x || transform.y !== meaninglessTransform.y || transform.rotate !== meaninglessTransform.rotate || transform.flipX || transform.flipY;
    }

    function transformForSvg(_ref) {
      var transform = _ref.transform,
          containerWidth = _ref.containerWidth,
          iconWidth = _ref.iconWidth;
      var outer = {
        transform: "translate(".concat(containerWidth / 2, " 256)")
      };
      var innerTranslate = "translate(".concat(transform.x * 32, ", ").concat(transform.y * 32, ") ");
      var innerScale = "scale(".concat(transform.size / 16 * (transform.flipX ? -1 : 1), ", ").concat(transform.size / 16 * (transform.flipY ? -1 : 1), ") ");
      var innerRotate = "rotate(".concat(transform.rotate, " 0 0)");
      var inner = {
        transform: "".concat(innerTranslate, " ").concat(innerScale, " ").concat(innerRotate)
      };
      var path = {
        transform: "translate(".concat(iconWidth / 2 * -1, " -256)")
      };
      return {
        outer: outer,
        inner: inner,
        path: path
      };
    }

    var ALL_SPACE = {
      x: 0,
      y: 0,
      width: '100%',
      height: '100%'
    };

    function fillBlack(abstract) {
      var force = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

      if (abstract.attributes && (abstract.attributes.fill || force)) {
        abstract.attributes.fill = 'black';
      }

      return abstract;
    }

    function deGroup(abstract) {
      if (abstract.tag === 'g') {
        return abstract.children;
      } else {
        return [abstract];
      }
    }

    function makeIconMasking(_ref) {
      var children = _ref.children,
          attributes = _ref.attributes,
          main = _ref.main,
          mask = _ref.mask,
          explicitMaskId = _ref.maskId,
          transform = _ref.transform;
      var mainWidth = main.width,
          mainPath = main.icon;
      var maskWidth = mask.width,
          maskPath = mask.icon;
      var trans = transformForSvg({
        transform: transform,
        containerWidth: maskWidth,
        iconWidth: mainWidth
      });
      var maskRect = {
        tag: 'rect',
        attributes: _objectSpread({}, ALL_SPACE, {
          fill: 'white'
        })
      };
      var maskInnerGroupChildrenMixin = mainPath.children ? {
        children: mainPath.children.map(fillBlack)
      } : {};
      var maskInnerGroup = {
        tag: 'g',
        attributes: _objectSpread({}, trans.inner),
        children: [fillBlack(_objectSpread({
          tag: mainPath.tag,
          attributes: _objectSpread({}, mainPath.attributes, trans.path)
        }, maskInnerGroupChildrenMixin))]
      };
      var maskOuterGroup = {
        tag: 'g',
        attributes: _objectSpread({}, trans.outer),
        children: [maskInnerGroup]
      };
      var maskId = "mask-".concat(explicitMaskId || nextUniqueId());
      var clipId = "clip-".concat(explicitMaskId || nextUniqueId());
      var maskTag = {
        tag: 'mask',
        attributes: _objectSpread({}, ALL_SPACE, {
          id: maskId,
          maskUnits: 'userSpaceOnUse',
          maskContentUnits: 'userSpaceOnUse'
        }),
        children: [maskRect, maskOuterGroup]
      };
      var defs = {
        tag: 'defs',
        children: [{
          tag: 'clipPath',
          attributes: {
            id: clipId
          },
          children: deGroup(maskPath)
        }, maskTag]
      };
      children.push(defs, {
        tag: 'rect',
        attributes: _objectSpread({
          fill: 'currentColor',
          'clip-path': "url(#".concat(clipId, ")"),
          mask: "url(#".concat(maskId, ")")
        }, ALL_SPACE)
      });
      return {
        children: children,
        attributes: attributes
      };
    }

    function makeIconStandard(_ref) {
      var children = _ref.children,
          attributes = _ref.attributes,
          main = _ref.main,
          transform = _ref.transform,
          styles = _ref.styles;
      var styleString = joinStyles(styles);

      if (styleString.length > 0) {
        attributes['style'] = styleString;
      }

      if (transformIsMeaningful(transform)) {
        var trans = transformForSvg({
          transform: transform,
          containerWidth: main.width,
          iconWidth: main.width
        });
        children.push({
          tag: 'g',
          attributes: _objectSpread({}, trans.outer),
          children: [{
            tag: 'g',
            attributes: _objectSpread({}, trans.inner),
            children: [{
              tag: main.icon.tag,
              children: main.icon.children,
              attributes: _objectSpread({}, main.icon.attributes, trans.path)
            }]
          }]
        });
      } else {
        children.push(main.icon);
      }

      return {
        children: children,
        attributes: attributes
      };
    }

    function asIcon(_ref) {
      var children = _ref.children,
          main = _ref.main,
          mask = _ref.mask,
          attributes = _ref.attributes,
          styles = _ref.styles,
          transform = _ref.transform;

      if (transformIsMeaningful(transform) && main.found && !mask.found) {
        var width = main.width,
            height = main.height;
        var offset = {
          x: width / height / 2,
          y: 0.5
        };
        attributes['style'] = joinStyles(_objectSpread({}, styles, {
          'transform-origin': "".concat(offset.x + transform.x / 16, "em ").concat(offset.y + transform.y / 16, "em")
        }));
      }

      return [{
        tag: 'svg',
        attributes: attributes,
        children: children
      }];
    }

    function asSymbol(_ref) {
      var prefix = _ref.prefix,
          iconName = _ref.iconName,
          children = _ref.children,
          attributes = _ref.attributes,
          symbol = _ref.symbol;
      var id = symbol === true ? "".concat(prefix, "-").concat(config.familyPrefix, "-").concat(iconName) : symbol;
      return [{
        tag: 'svg',
        attributes: {
          style: 'display: none;'
        },
        children: [{
          tag: 'symbol',
          attributes: _objectSpread({}, attributes, {
            id: id
          }),
          children: children
        }]
      }];
    }

    function makeInlineSvgAbstract(params) {
      var _params$icons = params.icons,
          main = _params$icons.main,
          mask = _params$icons.mask,
          prefix = params.prefix,
          iconName = params.iconName,
          transform = params.transform,
          symbol = params.symbol,
          title = params.title,
          maskId = params.maskId,
          titleId = params.titleId,
          extra = params.extra,
          _params$watchable = params.watchable,
          watchable = _params$watchable === void 0 ? false : _params$watchable;

      var _ref = mask.found ? mask : main,
          width = _ref.width,
          height = _ref.height;

      var isUploadedIcon = prefix === 'fak';
      var widthClass = isUploadedIcon ? '' : "fa-w-".concat(Math.ceil(width / height * 16));
      var attrClass = [config.replacementClass, iconName ? "".concat(config.familyPrefix, "-").concat(iconName) : '', widthClass].filter(function (c) {
        return extra.classes.indexOf(c) === -1;
      }).filter(function (c) {
        return c !== '' || !!c;
      }).concat(extra.classes).join(' ');
      var content = {
        children: [],
        attributes: _objectSpread({}, extra.attributes, {
          'data-prefix': prefix,
          'data-icon': iconName,
          'class': attrClass,
          'role': extra.attributes.role || 'img',
          'xmlns': 'http://www.w3.org/2000/svg',
          'viewBox': "0 0 ".concat(width, " ").concat(height)
        })
      };
      var uploadedIconWidthStyle = isUploadedIcon && !~extra.classes.indexOf('fa-fw') ? {
        width: "".concat(width / height * 16 * 0.0625, "em")
      } : {};

      if (watchable) {
        content.attributes[DATA_FA_I2SVG] = '';
      }

      if (title) content.children.push({
        tag: 'title',
        attributes: {
          id: content.attributes['aria-labelledby'] || "title-".concat(titleId || nextUniqueId())
        },
        children: [title]
      });

      var args = _objectSpread({}, content, {
        prefix: prefix,
        iconName: iconName,
        main: main,
        mask: mask,
        maskId: maskId,
        transform: transform,
        symbol: symbol,
        styles: _objectSpread({}, uploadedIconWidthStyle, extra.styles)
      });

      var _ref2 = mask.found && main.found ? makeIconMasking(args) : makeIconStandard(args),
          children = _ref2.children,
          attributes = _ref2.attributes;

      args.children = children;
      args.attributes = attributes;

      if (symbol) {
        return asSymbol(args);
      } else {
        return asIcon(args);
      }
    }
    /**
     * Internal helper to bind a function known to have 4 arguments
     * to a given context.
     */

    var bindInternal4 = function bindInternal4(func, thisContext) {
      return function (a, b, c, d) {
        return func.call(thisContext, a, b, c, d);
      };
    };
    /**
     * # Reduce
     *
     * A fast object `.reduce()` implementation.
     *
     * @param  {Object}   subject      The object to reduce over.
     * @param  {Function} fn           The reducer function.
     * @param  {mixed}    initialValue The initial value for the reducer, defaults to subject[0].
     * @param  {Object}   thisContext  The context for the reducer.
     * @return {mixed}                 The final result.
     */


    var reduce = function fastReduceObject(subject, fn, initialValue, thisContext) {
      var keys = Object.keys(subject),
          length = keys.length,
          iterator = thisContext !== undefined ? bindInternal4(fn, thisContext) : fn,
          i,
          key,
          result;

      if (initialValue === undefined) {
        i = 1;
        result = subject[keys[0]];
      } else {
        i = 0;
        result = initialValue;
      }

      for (; i < length; i++) {
        key = keys[i];
        result = iterator(result, subject[key], key, subject);
      }

      return result;
    };

    function defineIcons(prefix, icons) {
      var params = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      var _params$skipHooks = params.skipHooks,
          skipHooks = _params$skipHooks === void 0 ? false : _params$skipHooks;
      var normalized = Object.keys(icons).reduce(function (acc, iconName) {
        var icon = icons[iconName];
        var expanded = !!icon.icon;

        if (expanded) {
          acc[icon.iconName] = icon.icon;
        } else {
          acc[iconName] = icon;
        }

        return acc;
      }, {});

      if (typeof namespace.hooks.addPack === 'function' && !skipHooks) {
        namespace.hooks.addPack(prefix, normalized);
      } else {
        namespace.styles[prefix] = _objectSpread({}, namespace.styles[prefix] || {}, normalized);
      }
      /**
       * Font Awesome 4 used the prefix of `fa` for all icons. With the introduction
       * of new styles we needed to differentiate between them. Prefix `fa` is now an alias
       * for `fas` so we'll easy the upgrade process for our users by automatically defining
       * this as well.
       */


      if (prefix === 'fas') {
        defineIcons('fa', icons);
      }
    }

    var styles = namespace.styles,
        shims = namespace.shims;

    var build = function build() {
      var lookup = function lookup(reducer) {
        return reduce(styles, function (o, style, prefix) {
          o[prefix] = reduce(style, reducer, {});
          return o;
        }, {});
      };

      lookup(function (acc, icon, iconName) {
        if (icon[3]) {
          acc[icon[3]] = iconName;
        }

        return acc;
      });
      lookup(function (acc, icon, iconName) {
        var ligatures = icon[2];
        acc[iconName] = iconName;
        ligatures.forEach(function (ligature) {
          acc[ligature] = iconName;
        });
        return acc;
      });
      var hasRegular = ('far' in styles);
      reduce(shims, function (acc, shim) {
        var oldName = shim[0];
        var prefix = shim[1];
        var iconName = shim[2];

        if (prefix === 'far' && !hasRegular) {
          prefix = 'fas';
        }

        acc[oldName] = {
          prefix: prefix,
          iconName: iconName
        };
        return acc;
      }, {});
    };

    build();

    function iconFromMapping(mapping, prefix, iconName) {
      if (mapping && mapping[prefix] && mapping[prefix][iconName]) {
        return {
          prefix: prefix,
          iconName: iconName,
          icon: mapping[prefix][iconName]
        };
      }
    }

    function toHtml(abstractNodes) {
      var tag = abstractNodes.tag,
          _abstractNodes$attrib = abstractNodes.attributes,
          attributes = _abstractNodes$attrib === void 0 ? {} : _abstractNodes$attrib,
          _abstractNodes$childr = abstractNodes.children,
          children = _abstractNodes$childr === void 0 ? [] : _abstractNodes$childr;

      if (typeof abstractNodes === 'string') {
        return htmlEscape(abstractNodes);
      } else {
        return "<".concat(tag, " ").concat(joinAttributes(attributes), ">").concat(children.map(toHtml).join(''), "</").concat(tag, ">");
      }
    }

    function MissingIcon(error) {
      this.name = 'MissingIcon';
      this.message = error || 'Icon unavailable';
      this.stack = new Error().stack;
    }

    MissingIcon.prototype = /*#__PURE__*/Object.create(Error.prototype);
    MissingIcon.prototype.constructor = MissingIcon;

    function asFoundIcon(icon) {
      var width = icon[0];
      var height = icon[1];

      var _icon$slice = icon.slice(4),
          _icon$slice2 = _slicedToArray(_icon$slice, 1),
          vectorData = _icon$slice2[0];

      var element = null;

      if (Array.isArray(vectorData)) {
        element = {
          tag: 'g',
          attributes: {
            class: "".concat(config.familyPrefix, "-").concat(DUOTONE_CLASSES.GROUP)
          },
          children: [{
            tag: 'path',
            attributes: {
              class: "".concat(config.familyPrefix, "-").concat(DUOTONE_CLASSES.SECONDARY),
              fill: 'currentColor',
              d: vectorData[0]
            }
          }, {
            tag: 'path',
            attributes: {
              class: "".concat(config.familyPrefix, "-").concat(DUOTONE_CLASSES.PRIMARY),
              fill: 'currentColor',
              d: vectorData[1]
            }
          }]
        };
      } else {
        element = {
          tag: 'path',
          attributes: {
            fill: 'currentColor',
            d: vectorData
          }
        };
      }

      return {
        found: true,
        width: width,
        height: height,
        icon: element
      };
    }
    var baseStyles = "svg:not(:root).svg-inline--fa {\n  overflow: visible;\n}\n\n.svg-inline--fa {\n  display: inline-block;\n  font-size: inherit;\n  height: 1em;\n  overflow: visible;\n  vertical-align: -0.125em;\n}\n.svg-inline--fa.fa-lg {\n  vertical-align: -0.225em;\n}\n.svg-inline--fa.fa-w-1 {\n  width: 0.0625em;\n}\n.svg-inline--fa.fa-w-2 {\n  width: 0.125em;\n}\n.svg-inline--fa.fa-w-3 {\n  width: 0.1875em;\n}\n.svg-inline--fa.fa-w-4 {\n  width: 0.25em;\n}\n.svg-inline--fa.fa-w-5 {\n  width: 0.3125em;\n}\n.svg-inline--fa.fa-w-6 {\n  width: 0.375em;\n}\n.svg-inline--fa.fa-w-7 {\n  width: 0.4375em;\n}\n.svg-inline--fa.fa-w-8 {\n  width: 0.5em;\n}\n.svg-inline--fa.fa-w-9 {\n  width: 0.5625em;\n}\n.svg-inline--fa.fa-w-10 {\n  width: 0.625em;\n}\n.svg-inline--fa.fa-w-11 {\n  width: 0.6875em;\n}\n.svg-inline--fa.fa-w-12 {\n  width: 0.75em;\n}\n.svg-inline--fa.fa-w-13 {\n  width: 0.8125em;\n}\n.svg-inline--fa.fa-w-14 {\n  width: 0.875em;\n}\n.svg-inline--fa.fa-w-15 {\n  width: 0.9375em;\n}\n.svg-inline--fa.fa-w-16 {\n  width: 1em;\n}\n.svg-inline--fa.fa-w-17 {\n  width: 1.0625em;\n}\n.svg-inline--fa.fa-w-18 {\n  width: 1.125em;\n}\n.svg-inline--fa.fa-w-19 {\n  width: 1.1875em;\n}\n.svg-inline--fa.fa-w-20 {\n  width: 1.25em;\n}\n.svg-inline--fa.fa-pull-left {\n  margin-right: 0.3em;\n  width: auto;\n}\n.svg-inline--fa.fa-pull-right {\n  margin-left: 0.3em;\n  width: auto;\n}\n.svg-inline--fa.fa-border {\n  height: 1.5em;\n}\n.svg-inline--fa.fa-li {\n  width: 2em;\n}\n.svg-inline--fa.fa-fw {\n  width: 1.25em;\n}\n\n.fa-layers svg.svg-inline--fa {\n  bottom: 0;\n  left: 0;\n  margin: auto;\n  position: absolute;\n  right: 0;\n  top: 0;\n}\n\n.fa-layers {\n  display: inline-block;\n  height: 1em;\n  position: relative;\n  text-align: center;\n  vertical-align: -0.125em;\n  width: 1em;\n}\n.fa-layers svg.svg-inline--fa {\n  -webkit-transform-origin: center center;\n          transform-origin: center center;\n}\n\n.fa-layers-counter, .fa-layers-text {\n  display: inline-block;\n  position: absolute;\n  text-align: center;\n}\n\n.fa-layers-text {\n  left: 50%;\n  top: 50%;\n  -webkit-transform: translate(-50%, -50%);\n          transform: translate(-50%, -50%);\n  -webkit-transform-origin: center center;\n          transform-origin: center center;\n}\n\n.fa-layers-counter {\n  background-color: #ff253a;\n  border-radius: 1em;\n  -webkit-box-sizing: border-box;\n          box-sizing: border-box;\n  color: #fff;\n  height: 1.5em;\n  line-height: 1;\n  max-width: 5em;\n  min-width: 1.5em;\n  overflow: hidden;\n  padding: 0.25em;\n  right: 0;\n  text-overflow: ellipsis;\n  top: 0;\n  -webkit-transform: scale(0.25);\n          transform: scale(0.25);\n  -webkit-transform-origin: top right;\n          transform-origin: top right;\n}\n\n.fa-layers-bottom-right {\n  bottom: 0;\n  right: 0;\n  top: auto;\n  -webkit-transform: scale(0.25);\n          transform: scale(0.25);\n  -webkit-transform-origin: bottom right;\n          transform-origin: bottom right;\n}\n\n.fa-layers-bottom-left {\n  bottom: 0;\n  left: 0;\n  right: auto;\n  top: auto;\n  -webkit-transform: scale(0.25);\n          transform: scale(0.25);\n  -webkit-transform-origin: bottom left;\n          transform-origin: bottom left;\n}\n\n.fa-layers-top-right {\n  right: 0;\n  top: 0;\n  -webkit-transform: scale(0.25);\n          transform: scale(0.25);\n  -webkit-transform-origin: top right;\n          transform-origin: top right;\n}\n\n.fa-layers-top-left {\n  left: 0;\n  right: auto;\n  top: 0;\n  -webkit-transform: scale(0.25);\n          transform: scale(0.25);\n  -webkit-transform-origin: top left;\n          transform-origin: top left;\n}\n\n.fa-lg {\n  font-size: 1.3333333333em;\n  line-height: 0.75em;\n  vertical-align: -0.0667em;\n}\n\n.fa-xs {\n  font-size: 0.75em;\n}\n\n.fa-sm {\n  font-size: 0.875em;\n}\n\n.fa-1x {\n  font-size: 1em;\n}\n\n.fa-2x {\n  font-size: 2em;\n}\n\n.fa-3x {\n  font-size: 3em;\n}\n\n.fa-4x {\n  font-size: 4em;\n}\n\n.fa-5x {\n  font-size: 5em;\n}\n\n.fa-6x {\n  font-size: 6em;\n}\n\n.fa-7x {\n  font-size: 7em;\n}\n\n.fa-8x {\n  font-size: 8em;\n}\n\n.fa-9x {\n  font-size: 9em;\n}\n\n.fa-10x {\n  font-size: 10em;\n}\n\n.fa-fw {\n  text-align: center;\n  width: 1.25em;\n}\n\n.fa-ul {\n  list-style-type: none;\n  margin-left: 2.5em;\n  padding-left: 0;\n}\n.fa-ul > li {\n  position: relative;\n}\n\n.fa-li {\n  left: -2em;\n  position: absolute;\n  text-align: center;\n  width: 2em;\n  line-height: inherit;\n}\n\n.fa-border {\n  border: solid 0.08em #eee;\n  border-radius: 0.1em;\n  padding: 0.2em 0.25em 0.15em;\n}\n\n.fa-pull-left {\n  float: left;\n}\n\n.fa-pull-right {\n  float: right;\n}\n\n.fa.fa-pull-left,\n.fas.fa-pull-left,\n.far.fa-pull-left,\n.fal.fa-pull-left,\n.fab.fa-pull-left {\n  margin-right: 0.3em;\n}\n.fa.fa-pull-right,\n.fas.fa-pull-right,\n.far.fa-pull-right,\n.fal.fa-pull-right,\n.fab.fa-pull-right {\n  margin-left: 0.3em;\n}\n\n.fa-spin {\n  -webkit-animation: fa-spin 2s infinite linear;\n          animation: fa-spin 2s infinite linear;\n}\n\n.fa-pulse {\n  -webkit-animation: fa-spin 1s infinite steps(8);\n          animation: fa-spin 1s infinite steps(8);\n}\n\n@-webkit-keyframes fa-spin {\n  0% {\n    -webkit-transform: rotate(0deg);\n            transform: rotate(0deg);\n  }\n  100% {\n    -webkit-transform: rotate(360deg);\n            transform: rotate(360deg);\n  }\n}\n\n@keyframes fa-spin {\n  0% {\n    -webkit-transform: rotate(0deg);\n            transform: rotate(0deg);\n  }\n  100% {\n    -webkit-transform: rotate(360deg);\n            transform: rotate(360deg);\n  }\n}\n.fa-rotate-90 {\n  -ms-filter: \"progid:DXImageTransform.Microsoft.BasicImage(rotation=1)\";\n  -webkit-transform: rotate(90deg);\n          transform: rotate(90deg);\n}\n\n.fa-rotate-180 {\n  -ms-filter: \"progid:DXImageTransform.Microsoft.BasicImage(rotation=2)\";\n  -webkit-transform: rotate(180deg);\n          transform: rotate(180deg);\n}\n\n.fa-rotate-270 {\n  -ms-filter: \"progid:DXImageTransform.Microsoft.BasicImage(rotation=3)\";\n  -webkit-transform: rotate(270deg);\n          transform: rotate(270deg);\n}\n\n.fa-flip-horizontal {\n  -ms-filter: \"progid:DXImageTransform.Microsoft.BasicImage(rotation=0, mirror=1)\";\n  -webkit-transform: scale(-1, 1);\n          transform: scale(-1, 1);\n}\n\n.fa-flip-vertical {\n  -ms-filter: \"progid:DXImageTransform.Microsoft.BasicImage(rotation=2, mirror=1)\";\n  -webkit-transform: scale(1, -1);\n          transform: scale(1, -1);\n}\n\n.fa-flip-both, .fa-flip-horizontal.fa-flip-vertical {\n  -ms-filter: \"progid:DXImageTransform.Microsoft.BasicImage(rotation=2, mirror=1)\";\n  -webkit-transform: scale(-1, -1);\n          transform: scale(-1, -1);\n}\n\n:root .fa-rotate-90,\n:root .fa-rotate-180,\n:root .fa-rotate-270,\n:root .fa-flip-horizontal,\n:root .fa-flip-vertical,\n:root .fa-flip-both {\n  -webkit-filter: none;\n          filter: none;\n}\n\n.fa-stack {\n  display: inline-block;\n  height: 2em;\n  position: relative;\n  width: 2.5em;\n}\n\n.fa-stack-1x,\n.fa-stack-2x {\n  bottom: 0;\n  left: 0;\n  margin: auto;\n  position: absolute;\n  right: 0;\n  top: 0;\n}\n\n.svg-inline--fa.fa-stack-1x {\n  height: 1em;\n  width: 1.25em;\n}\n.svg-inline--fa.fa-stack-2x {\n  height: 2em;\n  width: 2.5em;\n}\n\n.fa-inverse {\n  color: #fff;\n}\n\n.sr-only {\n  border: 0;\n  clip: rect(0, 0, 0, 0);\n  height: 1px;\n  margin: -1px;\n  overflow: hidden;\n  padding: 0;\n  position: absolute;\n  width: 1px;\n}\n\n.sr-only-focusable:active, .sr-only-focusable:focus {\n  clip: auto;\n  height: auto;\n  margin: 0;\n  overflow: visible;\n  position: static;\n  width: auto;\n}\n\n.svg-inline--fa .fa-primary {\n  fill: var(--fa-primary-color, currentColor);\n  opacity: 1;\n  opacity: var(--fa-primary-opacity, 1);\n}\n\n.svg-inline--fa .fa-secondary {\n  fill: var(--fa-secondary-color, currentColor);\n  opacity: 0.4;\n  opacity: var(--fa-secondary-opacity, 0.4);\n}\n\n.svg-inline--fa.fa-swap-opacity .fa-primary {\n  opacity: 0.4;\n  opacity: var(--fa-secondary-opacity, 0.4);\n}\n\n.svg-inline--fa.fa-swap-opacity .fa-secondary {\n  opacity: 1;\n  opacity: var(--fa-primary-opacity, 1);\n}\n\n.svg-inline--fa mask .fa-primary,\n.svg-inline--fa mask .fa-secondary {\n  fill: black;\n}\n\n.fad.fa-inverse {\n  color: #fff;\n}";

    function css() {
      var dfp = DEFAULT_FAMILY_PREFIX;
      var drc = DEFAULT_REPLACEMENT_CLASS;
      var fp = config.familyPrefix;
      var rc = config.replacementClass;
      var s = baseStyles;

      if (fp !== dfp || rc !== drc) {
        var dPatt = new RegExp("\\.".concat(dfp, "\\-"), 'g');
        var customPropPatt = new RegExp("\\--".concat(dfp, "\\-"), 'g');
        var rPatt = new RegExp("\\.".concat(drc), 'g');
        s = s.replace(dPatt, ".".concat(fp, "-")).replace(customPropPatt, "--".concat(fp, "-")).replace(rPatt, ".".concat(rc));
      }

      return s;
    }

    var Library = /*#__PURE__*/function () {
      function Library() {
        _classCallCheck(this, Library);

        this.definitions = {};
      }

      _createClass(Library, [{
        key: "add",
        value: function add() {
          var _this = this;

          for (var _len = arguments.length, definitions = new Array(_len), _key = 0; _key < _len; _key++) {
            definitions[_key] = arguments[_key];
          }

          var additions = definitions.reduce(this._pullDefinitions, {});
          Object.keys(additions).forEach(function (key) {
            _this.definitions[key] = _objectSpread({}, _this.definitions[key] || {}, additions[key]);
            defineIcons(key, additions[key]);
            build();
          });
        }
      }, {
        key: "reset",
        value: function reset() {
          this.definitions = {};
        }
      }, {
        key: "_pullDefinitions",
        value: function _pullDefinitions(additions, definition) {
          var normalized = definition.prefix && definition.iconName && definition.icon ? {
            0: definition
          } : definition;
          Object.keys(normalized).map(function (key) {
            var _normalized$key = normalized[key],
                prefix = _normalized$key.prefix,
                iconName = _normalized$key.iconName,
                icon = _normalized$key.icon;
            if (!additions[prefix]) additions[prefix] = {};
            additions[prefix][iconName] = icon;
          });
          return additions;
        }
      }]);

      return Library;
    }();

    function ensureCss() {
      if (config.autoAddCss && !_cssInserted) {
        insertCss(css());
        _cssInserted = true;
      }
    }

    function apiObject(val, abstractCreator) {
      Object.defineProperty(val, 'abstract', {
        get: abstractCreator
      });
      Object.defineProperty(val, 'html', {
        get: function get() {
          return val.abstract.map(function (a) {
            return toHtml(a);
          });
        }
      });
      Object.defineProperty(val, 'node', {
        get: function get() {
          if (!IS_DOM) return;
          var container = DOCUMENT.createElement('div');
          container.innerHTML = val.html;
          return container.children;
        }
      });
      return val;
    }

    function findIconDefinition(iconLookup) {
      var _iconLookup$prefix = iconLookup.prefix,
          prefix = _iconLookup$prefix === void 0 ? 'fa' : _iconLookup$prefix,
          iconName = iconLookup.iconName;
      if (!iconName) return;
      return iconFromMapping(library.definitions, prefix, iconName) || iconFromMapping(namespace.styles, prefix, iconName);
    }

    function resolveIcons(next) {
      return function (maybeIconDefinition) {
        var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        var iconDefinition = (maybeIconDefinition || {}).icon ? maybeIconDefinition : findIconDefinition(maybeIconDefinition || {});
        var mask = params.mask;

        if (mask) {
          mask = (mask || {}).icon ? mask : findIconDefinition(mask || {});
        }

        return next(iconDefinition, _objectSpread({}, params, {
          mask: mask
        }));
      };
    }

    var library = /*#__PURE__*/new Library();
    var _cssInserted = false;
    var icon = /*#__PURE__*/resolveIcons(function (iconDefinition) {
      var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var _params$transform = params.transform,
          transform = _params$transform === void 0 ? meaninglessTransform : _params$transform,
          _params$symbol = params.symbol,
          symbol = _params$symbol === void 0 ? false : _params$symbol,
          _params$mask = params.mask,
          mask = _params$mask === void 0 ? null : _params$mask,
          _params$maskId = params.maskId,
          maskId = _params$maskId === void 0 ? null : _params$maskId,
          _params$title = params.title,
          title = _params$title === void 0 ? null : _params$title,
          _params$titleId = params.titleId,
          titleId = _params$titleId === void 0 ? null : _params$titleId,
          _params$classes = params.classes,
          classes = _params$classes === void 0 ? [] : _params$classes,
          _params$attributes = params.attributes,
          attributes = _params$attributes === void 0 ? {} : _params$attributes,
          _params$styles = params.styles,
          styles = _params$styles === void 0 ? {} : _params$styles;
      if (!iconDefinition) return;
      var prefix = iconDefinition.prefix,
          iconName = iconDefinition.iconName,
          icon = iconDefinition.icon;
      return apiObject(_objectSpread({
        type: 'icon'
      }, iconDefinition), function () {
        ensureCss();

        if (config.autoA11y) {
          if (title) {
            attributes['aria-labelledby'] = "".concat(config.replacementClass, "-title-").concat(titleId || nextUniqueId());
          } else {
            attributes['aria-hidden'] = 'true';
            attributes['focusable'] = 'false';
          }
        }

        return makeInlineSvgAbstract({
          icons: {
            main: asFoundIcon(icon),
            mask: mask ? asFoundIcon(mask.icon) : {
              found: false,
              width: null,
              height: null,
              icon: {}
            }
          },
          prefix: prefix,
          iconName: iconName,
          transform: _objectSpread({}, meaninglessTransform, transform),
          symbol: symbol,
          title: title,
          maskId: maskId,
          titleId: titleId,
          extra: {
            attributes: attributes,
            styles: styles,
            classes: classes
          }
        });
      });
    });

    class FaIcon extends Hole {
      constructor(icon) {
        super('svg', [icon], []);
      }

    }

    function fa(iconInput) {
      return new FaIcon(icon(iconInput).html[0]);
    }

    function debounce(func, wait, immediate) {
      if (immediate === void 0) {
        immediate = false;
      }

      var timeout;
      return function () {
        var context = this,
            args = arguments;

        var later = function later() {
          timeout = null;
          if (!immediate) func.apply(context, args);
        };

        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
      };
    }

    var _templateObject, _templateObject2, _templateObject3, _templateObject4, _templateObject5, _templateObject6, _templateObject7, _templateObject8, _templateObject9, _templateObject10, _templateObject11, _templateObject12, _templateObject13, _templateObject14, _templateObject15, _templateObject16, _templateObject17, _templateObject18, _templateObject19, _templateObject20, _templateObject21, _templateObject22, _templateObject23, _templateObject24, _templateObject25, _templateObject26, _templateObject27, _templateObject28, _templateObject29, _templateObject30;
    class ElementBase extends EventTarget {
      constructor() {
        var _definition$formBind, _this$definition$form, _this$definition$form2, _this$definition$form3, _this$definition$form4, _this$definition$form5, _this$definition$form6, _this$definition$form7, _this$definition$form8, _this$definition$form9, _this$definition$form10;

        super();
        this.jsonldKey = 'value';

        this.render = () => null;

        this.suggestions = [];
        this.children = [];
        this.attributes = {
          type: 'input',
          class: [],
          disabled: null,
          readonly: null,
          placeholder: null,
          required: null,
          multiple: null,
          rows: null,
          open: null
        };
        this.wrapperAttributes = {
          open: false,
          class: ['form-element']
        };
        this.labelAttributes = {
          class: ['label']
        };
        this.options = [];

        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        var [definition, bindings, value, itemValues, parentValues, render, parent, index, children] = args;
        this.definition = definition;
        this.bindings = bindings;
        this.mainBinding = (_definition$formBind = definition['form:binding']) == null ? void 0 : _definition$formBind._;
        this.parentValues = parentValues;
        this.itemValues = itemValues;
        this.value = value;
        this.render = render;
        this.parent = parent;
        this.index = index;
        this.children = children;
        this.debouncedRender = debounce(this.render.bind(this), 300);

        if (this.definition['form:jsonLdKey']) {
          this.jsonldKey = this.definition['form:jsonLdKey']._;
        }

        if ((_this$definition$form = this.definition['form:placeholder']) != null && _this$definition$form._) this.attributes.placeholder = (_this$definition$form2 = this.definition['form:placeholder']) == null ? void 0 : _this$definition$form2._;
        if (((_this$definition$form3 = this.definition['form:required']) == null ? void 0 : _this$definition$form3._) === true) this.attributes.required = true;
        if (((_this$definition$form4 = this.definition['form:multiple']) == null ? void 0 : _this$definition$form4._) === true) this.attributes.multiple = true;
        if (((_this$definition$form5 = this.definition['form:readonly']) == null ? void 0 : _this$definition$form5._) === true) this.attributes.readonly = true;
        if (((_this$definition$form6 = this.definition['form:disabled']) == null ? void 0 : _this$definition$form6._) === true) this.attributes.disabled = true;
        if (((_this$definition$form7 = this.definition['form:open']) == null ? void 0 : _this$definition$form7._) !== undefined) this.wrapperAttributes.open = this.definition['form:open']._;
        if (((_this$definition$form8 = this.definition['form:rows']) == null ? void 0 : _this$definition$form8._) !== undefined) this.attributes.rows = parseInt(this.definition['form:rows']._);
        if ((_this$definition$form9 = this.definition['form:cssClass']) != null && _this$definition$form9._) this.wrapperAttributes.class.push(this.definition['form:cssClass']._);
        if (!((_this$definition$form10 = this.definition['form:label']) != null && _this$definition$form10._)) this.wrapperAttributes.class.push('no-label');

        if (this.definition['form:option']) {
          this.options.push(...this.definition['form:option'].map(option => {
            var _option$formLabel, _option$formImage, _option$formValue;

            return {
              label: (_option$formLabel = option['form:label']) == null ? void 0 : _option$formLabel._,
              image: (_option$formImage = option['form:image']) == null ? void 0 : _option$formImage._,
              uri: (_option$formValue = option['form:value']) == null ? void 0 : _option$formValue._,
              jsonldKey: Object.keys(option['form:value'][0])[0].substr(1)
            };
          }));
        }

        this.addEventListener('destroy', () => {
          this.destroy();
        }, {
          once: true
        });
      }

      destroy() {
        return _asyncToGenerator(function* () {})();
      }

      get proxy() {
        var _this$form$proxy, _this$form;

        return (_this$form$proxy = (_this$form = this.form) == null ? void 0 : _this$form.proxy) != null ? _this$form$proxy : '';
      }

      get t() {
        var _this$form2;

        return (_this$form2 = this.form) == null ? void 0 : _this$form2.t;
      }

      get form() {
        var pointer = this;

        while (pointer.parent) {
          pointer = pointer.parent;
        }

        return pointer.registry ? pointer : null;
      }

      on(event) {
        if (['keyup', 'change'].includes(event.type)) {
          if (!this.value) this.addItem();

          if (this.value) {
            this.value["@" + this.jsonldKey] = event.target.value;
            this.dispatchChange();
          }
        }
      }

      dispatchChange() {
        this.form.dispatchEvent(new CustomEvent('fieldchange', {
          detail: {
            value: this.value,
            field: this,
            proxy: this.form.formData.proxy,
            expanded: this.form.formData.proxy.$
          }
        }));
      }

      get removable() {
        var _this$definition, _this$definition$form11, _this$value, _this$parent, _this$parent$definiti, _this$parent$definiti2, _this$definition2, _this$definition2$for, _this$definition3, _this$definition3$for;

        if (((_this$definition = this.definition) == null ? void 0 : (_this$definition$form11 = _this$definition['form:removable']) == null ? void 0 : _this$definition$form11._) === false) return false;
        var hasValue = (_this$value = this.value) == null ? void 0 : _this$value._;
        var parentIsGroup = this.parent instanceof ElementBase ? ((_this$parent = this.parent) == null ? void 0 : (_this$parent$definiti = _this$parent.definition) == null ? void 0 : (_this$parent$definiti2 = _this$parent$definiti['form:widget']) == null ? void 0 : _this$parent$definiti2._) === 'group' : false;
        var isGroup = ((_this$definition2 = this.definition) == null ? void 0 : (_this$definition2$for = _this$definition2['form:widget']) == null ? void 0 : _this$definition2$for._) === 'group';
        var isRequired = (_this$definition3 = this.definition) == null ? void 0 : (_this$definition3$for = _this$definition3['form:required']) == null ? void 0 : _this$definition3$for._;
        return !isRequired && hasValue && !parentIsGroup || isGroup;
      }

      get languages() {
        var _this$parentValues;

        return Language.extractUsedLanguages((_this$parentValues = this.parentValues) == null ? void 0 : _this$parentValues[this.mainBinding]);
      }

      addItem() {
        var _this$definition$form12;

        if (this.bindings.length > 1) {
          if (!this.parentValues[this.mainBinding]) this.parentValues[this.mainBinding] = [];
          var emptyObject = {};

          for (var binding of this.bindings) {
            emptyObject[binding] = [];
          }

          emptyObject[this.mainBinding].push({});
          this.parentValues.push(emptyObject);
          this.itemValues = emptyObject;
          this.value = emptyObject[this.mainBinding][0];
        } else if (((_this$definition$form12 = this.definition['form:widget']) == null ? void 0 : _this$definition$form12._) === 'group') {
          var _this$parentValues$th, _this$parentValues$th2, _this$parentValues2;

          if (!this.parentValues[this.mainBinding]) {
            this.parentValues[this.mainBinding] = [{
              '@list': [{}]
            }];
          }

          var firstItem = (_this$parentValues$th = this.parentValues[this.mainBinding]) == null ? void 0 : (_this$parentValues$th2 = _this$parentValues$th[0]) == null ? void 0 : _this$parentValues$th2.$;
          var clone = JSON.parse(JSON.stringify(firstItem));

          for (var [_field, values] of Object.entries(clone)) {
            if (values != null && values[0]['@id']) values[0]['@id'] = null;
            if (values != null && values[0]['@value']) values[0]['@value'] = '';
            if (values != null && values[0]['@language']) values[0]['@value'] = Language.l10nLanguage;
          }

          (_this$parentValues2 = this.parentValues) == null ? void 0 : _this$parentValues2[this.mainBinding].push(clone);
          this.value = clone;
        } else {
          var _this$definition$form13, _this$parentValues3, _this$parentValues4;

          var value = {
            ["@" + this.jsonldKey]: null
          };
          if (this.languages.length || ((_this$definition$form13 = this.definition['form:translatable']) == null ? void 0 : _this$definition$form13._) === 'always') value['@language'] = Language.l10nLanguage;
          if (!((_this$parentValues3 = this.parentValues) != null && _this$parentValues3[this.mainBinding])) this.parentValues[this.mainBinding] = [];
          (_this$parentValues4 = this.parentValues) == null ? void 0 : _this$parentValues4[this.mainBinding].push(value);
          this.value = value;
        }
      }

      removeItem() {
        if (this.bindings.length > 1) {
          var valueArray = this.parentValues.$;

          if (valueArray) {
            var index = valueArray.indexOf(this.itemValues.$);
            valueArray.splice(index, 1);
          }
        } else {
          var _this$parentValues$th3, _this$definition$form14;

          var _valueArray = (_this$parentValues$th3 = this.parentValues[(_this$definition$form14 = this.definition['form:binding']) == null ? void 0 : _this$definition$form14._]) == null ? void 0 : _this$parentValues$th3.$;

          if (_valueArray) {
            var _index = _valueArray.indexOf(this.value.$);

            _valueArray.splice(_index, 1);
          }
        }
      }

      wrapperDisplay(innerTemplates) {
        if (innerTemplates === void 0) {
          innerTemplates = [];
        }

        return this.wrapper(innerTemplates, true);
      }

      itemDisplay(childTemplates) {
        if (childTemplates === void 0) {
          childTemplates = [];
        }

        return html(_templateObject || (_templateObject = _taggedTemplateLiteralLoose(["\n    <div class=\"item\">\n      ", "\n      ", "\n    </div>"])), this.valueDisplay(), childTemplates);
      }

      valueDisplay() {
        var _this$value2;

        return html(_templateObject2 || (_templateObject2 = _taggedTemplateLiteralLoose(["", ""])), (_this$value2 = this.value) == null ? void 0 : _this$value2._);
      }

      wrapper(innerTemplates, isDisplayOnly) {
        var _this = this;

        return _asyncToGenerator(function* () {
          var _this$definition$form15, _this$definition$form16;

          if (innerTemplates === void 0) {
            innerTemplates = [];
          }

          if (isDisplayOnly === void 0) {
            isDisplayOnly = false;
          }

          var type = kebabize(_this.constructor.name);
          var shouldShowEmpty = ((_this$definition$form15 = _this.definition['form:translatable']) == null ? void 0 : _this$definition$form15._) === 'always' && !Language.l10nLanguage;
          return html(_templateObject3 || (_templateObject3 = _taggedTemplateLiteralLoose(["\n    ", ""])), !shouldShowEmpty && (!isDisplayOnly || innerTemplates.length > 0) ? html(_templateObject4 || (_templateObject4 = _taggedTemplateLiteralLoose(["\n    <div ref=", " name=", " type=\"", "\">\n    ", "\n    ", "\n      ", "\n    </div>\n    "])), attributesDiff(_this.wrapperAttributes), kebabize(lastPart(_this.definition['@id'])), type, _this.label(), innerTemplates.length ? html(_templateObject5 || (_templateObject5 = _taggedTemplateLiteralLoose(["\n      <div class=\"items\">\n        ", "\n        ", "\n      </div>\n    "])), _this.description(), innerTemplates) : '', (_this$definition$form16 = _this.definition['form:multiple']) != null && _this$definition$form16._ && !isDisplayOnly ? html(_templateObject6 || (_templateObject6 = _taggedTemplateLiteralLoose(["<div>", "</div>"])), _this.addButton()) : html(_templateObject7 || (_templateObject7 = _taggedTemplateLiteralLoose([""])))) : html(_templateObject8 || (_templateObject8 = _taggedTemplateLiteralLoose([""]))));
        })();
      }

      description() {
        var _this$definition$form17, _this$definition$form18;

        return (_this$definition$form17 = this.definition['form:description']) != null && _this$definition$form17._ ? html(_templateObject9 || (_templateObject9 = _taggedTemplateLiteralLoose(["<p class=\"description\">", "</p>"])), (_this$definition$form18 = this.definition['form:description']) == null ? void 0 : _this$definition$form18._) : null;
      }

      item(childTemplates) {
        if (childTemplates === void 0) {
          childTemplates = [];
        }

        return html(_templateObject10 || (_templateObject10 = _taggedTemplateLiteralLoose(["\n    <div class=\"item\">\n      ", "\n      ", "\n      ", "\n    </div>"])), this.input(), this.removeButton(), childTemplates);
      }

      addButton() {
        var _this2 = this;

        return html(_templateObject11 || (_templateObject11 = _taggedTemplateLiteralLoose(["<button type=\"button\" class=\"button add primary\" onclick=\"", "\">\n      ", "\n    </button>"])), /*#__PURE__*/_asyncToGenerator(function* () {
          yield _this2.addItem();

          _this2.render();
        }), fa(faPlus));
      }

      removeButton() {
        return this.removable ? html(_templateObject12 || (_templateObject12 = _taggedTemplateLiteralLoose(["<button type=\"button\" class=\"button remove danger\" onclick=\"", "\">\n      ", "\n    </button>"])), () => {
          this.removeItem();
          this.render();
        }, fa(faTimes)) : html(_templateObject13 || (_templateObject13 = _taggedTemplateLiteralLoose([""])));
      }

      input() {
        var _this$value$_, _this$value3;

        return html(_templateObject14 || (_templateObject14 = _taggedTemplateLiteralLoose(["\n      <input \n        ref=", " \n        .value=", " \n        onchange=", "\n        onkeyup=", "\n      />\n    "])), attributesDiff(this.attributes), (_this$value$_ = (_this$value3 = this.value) == null ? void 0 : _this$value3._) != null ? _this$value$_ : '', event => this.on(event), event => this.on(event));
      }

      disableLanguage() {
        var values = this.parentValues[this.mainBinding];

        if (values) {
          values.splice(1);
          delete values[0]['@language'];
        }
      }

      enableLanguage() {
        if (!this.parentValues[this.mainBinding]) this.parentValues[this.mainBinding] = this.parentValues[this.mainBinding] = [];
        var values = this.parentValues[this.mainBinding];

        if (values.length) {
          for (var value of values) {
            value['@language'] = Language.l10nLanguage;
            if (value['@value']) value['@value'] = value['@value'].toString();
          }
        } else {
          values.push({
            '@language': Language.l10nLanguage
          });
        }
      }

      label() {
        var _this3 = this;

        return _asyncToGenerator(function* () {
          var _this3$form, _this3$definition$for, _this3$definition$for3, _this3$definition$for4, _this3$definition$for5, _this3$definition$for6, _this3$definition$for7;

          var languageLabel = '';
          var isDisplayOnly = (_this3$form = _this3.form) == null ? void 0 : _this3$form.getAttribute('display');

          if ((_this3$definition$for = _this3.definition['form:translatable']) != null && _this3$definition$for._) {
            var _this3$parentValues, _this3$parentValues2, _this3$definition$for2;

            var applicableValues = (_this3$parentValues = _this3.parentValues) != null && _this3$parentValues[_this3.mainBinding] ? [..._this3.parentValues[_this3.mainBinding].values()].filter(value => !value['@language'] || value['@language'] === Language.l10nLanguage) : [];
            var hasLanguageValues = (_this3$parentValues2 = _this3.parentValues) != null && _this3$parentValues2[_this3.mainBinding] ? [..._this3.parentValues[_this3.mainBinding].values()].filter(item => item['@language']) : [];
            var language = hasLanguageValues.length ? Language.l10nLanguage : '';

            if (language) {
              languageLabel = "(" + Language.l10nLanguages[language] + ")";
            } else if (applicableValues.length === 0 && ((_this3$definition$for2 = _this3.definition['form:translatable']) == null ? void 0 : _this3$definition$for2._) === 'always') {
              languageLabel = "(" + Language.l10nLanguages[Language.l10nLanguage] + ")";
            }
          }

          var disableLanguage = () => {
            _this3.disableLanguage();

            _this3.render();
          };

          var enableLanguage = () => {
            _this3.enableLanguage();

            _this3.render();
          };

          return (_this3$definition$for3 = _this3.definition['form:label']) != null && _this3$definition$for3._ ? html(_templateObject15 || (_templateObject15 = _taggedTemplateLiteralLoose(["\n      <label ref=", ">\n        ", "", "\n        <small>&nbsp;<em>\n        ", "\n        ", "\n        ", "\n        </em></small>\n      </label>\n    "])), attributesDiff(_this3.labelAttributes), _this3.definition['form:label']._, isDisplayOnly ? ':' : '', languageLabel && !isDisplayOnly ? html(_templateObject16 || (_templateObject16 = _taggedTemplateLiteralLoose(["", ""])), languageLabel) : html(_templateObject17 || (_templateObject17 = _taggedTemplateLiteralLoose([""]))), _this3.languages.length && (_this3$definition$for4 = _this3.definition['form:translatable']) != null && _this3$definition$for4._ && ((_this3$definition$for5 = _this3.definition['form:translatable']) == null ? void 0 : _this3$definition$for5._) !== 'always' && languageLabel ? html(_templateObject18 || (_templateObject18 = _taggedTemplateLiteralLoose(["<span title=", " class=\"icon-button disable-language\" onclick=", ">", "</span>"])), _this3.t.direct('Disable translations for this field').toString(), disableLanguage, fa(faTimes)) : html(_templateObject19 || (_templateObject19 = _taggedTemplateLiteralLoose([""]))), (_this3$definition$for6 = _this3.definition['form:translatable']) != null && _this3$definition$for6._ && (_this3$definition$for7 = _this3.definition['form:translatable']) != null && _this3$definition$for7._ && !languageLabel ? html(_templateObject20 || (_templateObject20 = _taggedTemplateLiteralLoose(["<span title=", " class=\"icon-button enable-language\" onclick=", ">", "</span>"])), _this3.t.direct('Enable translations for this field').toString(), enableLanguage, fa(faLanguage)) : html(_templateObject21 || (_templateObject21 = _taggedTemplateLiteralLoose([""])))) : html(_templateObject22 || (_templateObject22 = _taggedTemplateLiteralLoose([""])));
        })();
      }

      referenceLabel(uri, meta) {
        var _this4 = this;

        return _asyncToGenerator(function* () {
          var _meta, _this4$value, _meta2, _meta3, _meta4, _meta5, _meta6, _meta7;

          if (!meta) {
            var subject = lastPart(uri).replace(/_|-/g, ' ');
            meta = {
              label: subject
            };
          }

          return html(_templateObject23 || (_templateObject23 = _taggedTemplateLiteralLoose(["\n      <div class=\"reference-label\">\n        ", "\n      </div>\n    "])), ((_meta = meta) == null ? void 0 : _meta.label) === false ? html(_templateObject24 || (_templateObject24 = _taggedTemplateLiteralLoose(["<span class=\"reference-loading\" title=", ">", "</span>"])), _this4.t.direct("Could not load data").toString(), (_this4$value = _this4.value) == null ? void 0 : _this4$value._) : html(_templateObject25 || (_templateObject25 = _taggedTemplateLiteralLoose(["\n          ", "\n          ", "\n        "])), (_meta2 = meta) != null && _meta2.thumbnail ? html(_templateObject26 || (_templateObject26 = _taggedTemplateLiteralLoose(["<div class=\"image\"><img src=\"", "\"></div>"])), "//images.weserv.nl/?url=" + ((_meta3 = meta) == null ? void 0 : _meta3.thumbnail) + "&default=" + ((_meta4 = meta) == null ? void 0 : _meta4.thumbnail) + "&w=100&h=100") : '', (_meta5 = meta) != null && _meta5.label ? isFetchable(uri) ? html(_templateObject27 || (_templateObject27 = _taggedTemplateLiteralLoose(["<a href=\"", "\" target=\"_blank\">", "</a>"])), uri, (_meta6 = meta) == null ? void 0 : _meta6.label) : html(_templateObject28 || (_templateObject28 = _taggedTemplateLiteralLoose(["<span class=\"reference-text\">", "</span>"])), (_meta7 = meta) == null ? void 0 : _meta7.label) : html(_templateObject29 || (_templateObject29 = _taggedTemplateLiteralLoose(["<span class=\"reference-loading\">", "</span>"])), _this4.t(_templateObject30 || (_templateObject30 = _taggedTemplateLiteralLoose(["Loading..."]))))));
        })();
      }

    }

    var _templateObject$1;
    class Checkbox extends ElementBase {
      on(event) {
        var _this = this;

        return _asyncToGenerator(function* () {
          if (['click'].includes(event.type)) {
            var _this$definition$form;

            if (!_this.value) yield _this.addItem();
            _this.value["@" + _this.jsonldKey] = (_this$definition$form = _this.definition['form:translatable']) != null && _this$definition$form._ && _this.value['@language'] ? event.target.checked.toString() : event.target.checked;

            _this.dispatchChange();

            _this.render();
          }
        })();
      }

      disableLanguage() {
        var _values$;

        super.disableLanguage();
        var values = this.parentValues[this.mainBinding];

        if (values != null && (_values$ = values[0]) != null && _values$['@value']) {
          values[0]['@value'] = values[0]['@value'] === 'true';
        }
      }

      input() {
        var _this$value, _this$value2;

        var checked = ((_this$value = this.value) == null ? void 0 : _this$value._) === true || ((_this$value2 = this.value) == null ? void 0 : _this$value2._) === 'true';
        return html(_templateObject$1 || (_templateObject$1 = _taggedTemplateLiteralLoose(["\n    <label class=\"switch\">\n      <input\n        onclick=", "\n        type=\"checkbox\"\n        .checked=\"", "\"\n      >\n      <span class=\"slider\"></span>\n    </label>\n    "])), event => this.on(event), checked);
      }

      get removable() {
        var _this$definition, _this$definition$form2, _this$value3, _this$parent, _this$parent$definiti, _this$parent$definiti2, _this$definition2, _this$definition2$for, _this$definition3, _this$definition3$for;

        if (((_this$definition = this.definition) == null ? void 0 : (_this$definition$form2 = _this$definition['form:removable']) == null ? void 0 : _this$definition$form2._) === false) return false;
        var hasValue = (_this$value3 = this.value) == null ? void 0 : _this$value3._;
        var parentIsGroup = this.parent instanceof ElementBase ? ((_this$parent = this.parent) == null ? void 0 : (_this$parent$definiti = _this$parent.definition) == null ? void 0 : (_this$parent$definiti2 = _this$parent$definiti['form:widget']) == null ? void 0 : _this$parent$definiti2._) === 'group' : false;
        var isGroup = ((_this$definition2 = this.definition) == null ? void 0 : (_this$definition2$for = _this$definition2['form:widget']) == null ? void 0 : _this$definition2$for._) === 'group';
        var isRequired = (_this$definition3 = this.definition) == null ? void 0 : (_this$definition3$for = _this$definition3['form:required']) == null ? void 0 : _this$definition3$for._;
        return !isRequired && hasValue && (!parentIsGroup || isGroup);
      }

    }

    class Color extends ElementBase {
      constructor() {
        super(...arguments);
        this.attributes.type = 'color';
      }

    }

    var _templateObject$2;
    class Container extends ElementBase {
      input() {
        return html(_templateObject$2 || (_templateObject$2 = _taggedTemplateLiteralLoose([""])));
      }

    }

    class Date$1 extends ElementBase {
      constructor() {
        super(...arguments);
        this.attributes.type = 'date';
      }

    }

    var _templateObject$3, _templateObject2$1, _templateObject3$1, _templateObject4$1, _templateObject5$1;
    class Details extends ElementBase {
      constructor() {
        var _this$parentValues, _this$parentValues$th;

        super(...arguments);
        var childValues = [...this.children.values()].flatMap(_ref => {
          var _fieldDefinition$form, _this$parentValues$ch;

          var [fieldDefinition] = _ref;
          var childBinding = (_fieldDefinition$form = fieldDefinition['form:binding']) == null ? void 0 : _fieldDefinition$form._;

          if (childBinding && (_this$parentValues$ch = this.parentValues[childBinding]) != null && _this$parentValues$ch._) {
            var _this$parentValues$ch2;

            return (_this$parentValues$ch2 = this.parentValues[childBinding]) == null ? void 0 : _this$parentValues$ch2.$;
          }
        }).filter(item => item);

        if (!('open' in this.wrapperAttributes) && (this.mainBinding && (_this$parentValues = this.parentValues) != null && (_this$parentValues$th = _this$parentValues[this.mainBinding]) != null && _this$parentValues$th.length || !this.mainBinding && childValues.length)) {
          this.wrapperAttributes.open = true;
        }
      }

      input() {
        return html(_templateObject$3 || (_templateObject$3 = _taggedTemplateLiteralLoose([""])));
      }

      wrapper(innerTemplates, isDisplayOnly) {
        var _this = this;

        return _asyncToGenerator(function* () {
          if (innerTemplates === void 0) {
            innerTemplates = [];
          }

          if (isDisplayOnly === void 0) {
            isDisplayOnly = false;
          }

          if (isDisplayOnly) {
            var resolvedInnerTemplates = yield Promise.all(innerTemplates);
            var tester = document.createElement('div');
            yield render(tester, html(_templateObject2$1 || (_templateObject2$1 = _taggedTemplateLiteralLoose(["", ""])), resolvedInnerTemplates));
            var text = tester.innerText.replace(/\n|\r/g, '').trim();
            if (text === '') return html(_templateObject3$1 || (_templateObject3$1 = _taggedTemplateLiteralLoose([""])));
          }

          var toggle = () => {
            _this.wrapperAttributes.open = !_this.wrapperAttributes.open;
          };

          var type = kebabize(_this.constructor.name);
          return html(_templateObject4$1 || (_templateObject4$1 = _taggedTemplateLiteralLoose(["\n    <details ref=", " type=\"", "\">\n      <summary onclick=", ">", "</summary>\n      ", "\n    </div>"])), attributesDiff(_this.wrapperAttributes), type, toggle, _this.label(), innerTemplates.length ? html(_templateObject5$1 || (_templateObject5$1 = _taggedTemplateLiteralLoose(["\n        <div class=\"items\">\n          ", "\n        </div>\n      "])), innerTemplates) : '');
        })();
      }

    }

    var Comunica$1=/*#__PURE__*/function(e){var t={};function r(n){if(t[n])return t[n].exports;var i=t[n]={i:n,l:!1,exports:{}};return e[n].call(i.exports,i,i.exports,r),i.l=!0,i.exports;}return r.m=e,r.c=t,r.d=function(e,t,n){r.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n});},r.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0});},r.t=function(e,t){if(1&t&&(e=r(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(r.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var i in e){r.d(n,i,function(t){return e[t];}.bind(null,i));}return n;},r.n=function(e){var t=e&&e.__esModule?function(){return e.default;}:function(){return e;};return r.d(t,"a",t),t;},r.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t);},r.p="",r(r.s=190);}([function(e,t,r){(function(e){var n=this&&this.__createBinding||(Object.create?function(e,t,r,n){void 0===n&&(n=r),Object.defineProperty(e,n,{enumerable:!0,get:function get(){return t[r];}});}:function(e,t,r,n){void 0===n&&(n=r),e[n]=t[r];}),i=this&&this.__exportStar||function(e,t){for(var r in e){"default"===r||Object.prototype.hasOwnProperty.call(t,r)||n(t,e,r);}};Object.defineProperty(t,"__esModule",{value:!0}),void 0!==e&&e.env.COMUNICA_DEBUG||(Error.stackTraceLimit=!1),i(r(92),t),i(r(194),t),i(r(195),t),i(r(196),t),i(r(93),t),i(r(197),t);}).call(this,r(8));},function(e,t,r){var n=this&&this.__createBinding||(Object.create?function(e,t,r,n){void 0===n&&(n=r),Object.defineProperty(e,n,{enumerable:!0,get:function get(){return t[r];}});}:function(e,t,r,n){void 0===n&&(n=r),e[n]=t[r];}),i=this&&this.__exportStar||function(e,t){for(var r in e){"default"===r||Object.prototype.hasOwnProperty.call(t,r)||n(t,e,r);}};Object.defineProperty(t,"__esModule",{value:!0}),i(r(94),t),i(r(111),t),i(r(217),t),i(r(95),t);},function(e,t,r){e.exports=i;var n=r(22).EventEmitter;function i(){n.call(this);}r(12)(i,n),i.Readable=r(71),i.Writable=r(224),i.Duplex=r(225),i.Transform=r(226),i.PassThrough=r(227),i.Stream=i,i.prototype.pipe=function(e,t){var r=this;function i(t){e.writable&&!1===e.write(t)&&r.pause&&r.pause();}function a(){r.readable&&r.resume&&r.resume();}r.on("data",i),e.on("drain",a),e._isStdio||t&&!1===t.end||(r.on("end",o),r.on("close",u));var s=!1;function o(){s||(s=!0,e.end());}function u(){s||(s=!0,"function"==typeof e.destroy&&e.destroy());}function c(e){if(l(),0===n.listenerCount(this,"error"))throw e;}function l(){r.removeListener("data",i),e.removeListener("drain",a),r.removeListener("end",o),r.removeListener("close",u),r.removeListener("error",c),e.removeListener("error",c),r.removeListener("end",l),r.removeListener("close",l),e.removeListener("close",l);}return r.on("error",c),e.on("error",c),r.on("end",l),r.on("close",l),e.on("close",l),e.emit("pipe",r),e;};},function(e,t,r){r.r(t),r.d(t,"scheduleTask",function(){return s;}),r.d(t,"getTaskScheduler",function(){return o;}),r.d(t,"setTaskScheduler",function(){return u;}),r.d(t,"INIT",function(){return c;}),r.d(t,"OPEN",function(){return l;}),r.d(t,"CLOSING",function(){return h;}),r.d(t,"CLOSED",function(){return d;}),r.d(t,"ENDED",function(){return p;}),r.d(t,"DESTROYED",function(){return f;}),r.d(t,"AsyncIterator",function(){return g;}),r.d(t,"EmptyIterator",function(){return _;}),r.d(t,"SingletonIterator",function(){return v;}),r.d(t,"ArrayIterator",function(){return w;}),r.d(t,"IntegerIterator",function(){return S;}),r.d(t,"BufferedIterator",function(){return T;}),r.d(t,"TransformIterator",function(){return E;}),r.d(t,"SimpleTransformIterator",function(){return R;}),r.d(t,"MultiTransformIterator",function(){return I;}),r.d(t,"UnionIterator",function(){return N;}),r.d(t,"ClonedIterator",function(){return C;}),r.d(t,"wrap",function(){return j;}),r.d(t,"empty",function(){return k;}),r.d(t,"single",function(){return L;}),r.d(t,"fromArray",function(){return M;}),r.d(t,"union",function(){return F;}),r.d(t,"range",function(){return B;});var n=r(22);var i=Promise.resolve(void 0);var a=function(){var e="function"==typeof queueMicrotask?queueMicrotask:e=>i.then(e);if("undefined"==typeof window)return e;var t=0;return r=>{++t<100?e(r):setTimeout(r,t=0);};}();function s(e){a(e);}function o(){return a;}function u(e){a=e;}var c=1,l=2,h=4,d=8,p=16,f=32;class g extends n.EventEmitter{constructor(e){if(e===void 0){e=l;}super(),this._readable=!1,this._state=e,this.on("newListener",m);}_changeState(e,t){if(t===void 0){t=!1;}var r=e>this._state&&this._state<p;return r&&(this._state=e,e===p&&(t?a(()=>this.emit("end")):this.emit("end"))),r;}read(){return null;}forEach(e,t){this.on("data",t?e.bind(t):e);}close(){this._changeState(d)&&this._endAsync();}destroy(e){this.done||this._destroy(e,t=>{(e=e||t)&&this.emit("error",e),this._end(!0);});}_destroy(e,t){t();}_end(e){if(e===void 0){e=!1;}this._changeState(e?f:p)&&(this._readable=!1,this.removeAllListeners("readable"),this.removeAllListeners("data"),this.removeAllListeners("end"));}_endAsync(){a(()=>this._end());}get readable(){return this._readable;}set readable(e){e=Boolean(e)&&!this.done,this._readable!==e&&(this._readable=e,e&&a(()=>this.emit("readable")));}get closed(){return this._state>=h;}get ended(){return this._state===p;}get destroyed(){return this._state===f;}get done(){return this._state>=p;}toString(){var e=this._toStringDetails();return "["+this.constructor.name+(e?" "+e:"")+"]";}_toStringDetails(){return "";}getProperty(e,t){var r=this._properties;if(!t)return r&&r[e];if(r&&e in r)a(()=>t(r[e]));else {var _r2;(_r2=this._propertyCallbacks)||(this._propertyCallbacks=_r2=Object.create(null)),e in _r2?_r2[e].push(t):_r2[e]=[t];}}setProperty(e,t){(this._properties||(this._properties=Object.create(null)))[e]=t;var r=this._propertyCallbacks||{},n=r[e];if(n){for(e in delete r[e],a(()=>{for(var _e2 of n){_e2(t);}}),r){return;}delete this._propertyCallbacks;}}getProperties(){var e=this._properties,t={};for(var _r3 in e){t[_r3]=e[_r3];}return t;}setProperties(e){for(var _t2 in e){this.setProperty(_t2,e[_t2]);}}copyProperties(e,t){var _this=this;var _loop=function _loop(_r4){e.getProperty(_r4,e=>_this.setProperty(_r4,e));};for(var _r4 of t){_loop(_r4);}}transform(e){return new R(this,e);}map(e,t){return this.transform({map:t?e.bind(t):e});}filter(e,t){return this.transform({filter:t?e.bind(t):e});}prepend(e){return this.transform({prepend:e});}append(e){return this.transform({append:e});}surround(e,t){return this.transform({prepend:e,append:t});}skip(e){return this.transform({offset:e});}take(e){return this.transform({limit:e});}range(e,t){return this.transform({offset:e,limit:Math.max(t-e+1,0)});}clone(){return new C(this);}}function m(e){"data"===e&&(this.removeListener("newListener",m),b(this,"readable",y),this.readable&&a(()=>y.call(this)));}function y(){var e;for(;0!==this.listenerCount("data")&&null!==(e=this.read());){this.emit("data",e);}0!==this.listenerCount("data")||this.done||(this.removeListener("readable",y),b(this,"newListener",m));}function b(e,t,r){e.listeners(t).includes(r)||e.on(t,r);}class _ extends g{constructor(){super(),this._changeState(p,!0);}}class v extends g{constructor(e){super(),this._item=e,null===e?this.close():this.readable=!0;}read(){var e=this._item;return this._item=null,this.close(),e;}_toStringDetails(){return null===this._item?"":"("+this._item+")";}}class w extends g{constructor(e,_temp){var{autoStart:t=!0}=_temp===void 0?{}:_temp;super();var r=e?[...e]:[];!1!==t&&0===r.length?this.close():(this.readable=!0,this._buffer=r);}read(){var e=null;var t=this._buffer;return t&&(0!==t.length&&(e=t.shift()),0===t.length&&(delete this._buffer,this.close())),e;}_toStringDetails(){return "("+(this._buffer&&this._buffer.length||0)+")";}_destroy(e,t){delete this._buffer,t();}}class S extends g{constructor(_temp2){var{start:e=0,step:t=1,end:r}=_temp2===void 0?{}:_temp2;super(),Number.isFinite(e)&&(e=Math.trunc(e)),this._next=e,Number.isFinite(t)&&(t=Math.trunc(t)),this._step=t;var n=t>=0,i=n?1/0:-1/0;Number.isFinite(r)?r=Math.trunc(r):r!==-i&&(r=i),this._last=r,!Number.isFinite(e)||(n?e>r:e<r)?this.close():this.readable=!0;}read(){if(this.closed)return null;var e=this._next,t=this._step,r=this._last,n=this._next+=t;return (t>=0?n>r:n<r)&&this.close(),e;}_toStringDetails(){return "("+this._next+"..."+this._last+")";}}class T extends g{constructor(_temp3){var{maxBufferSize:e=4,autoStart:t=!0}=_temp3===void 0?{}:_temp3;super(c),this._buffer=[],this._maxBufferSize=4,this._reading=!0,this._pushedCount=0,this.maxBufferSize=e,a(()=>this._init(t));}get maxBufferSize(){return this._maxBufferSize;}set maxBufferSize(e){e!==1/0&&(e=Number.isFinite(e)?Math.max(Math.trunc(e),1):4),this._maxBufferSize!==e&&(this._maxBufferSize=e,this._state===l&&this._fillBuffer());}_init(e){var t=!1;this._reading=!0,this._begin(()=>{if(t)throw new Error("done callback called multiple times");t=!0,this._reading=!1,this._changeState(l),e?this._fillBufferAsync():this.readable=!0;});}_begin(e){e();}read(){if(this.done)return null;var e=this._buffer;var t;return 0!==e.length?t=e.shift():(t=null,this.readable=!1),!this._reading&&e.length<this._maxBufferSize&&(this.closed?e.length||this._endAsync():this._fillBufferAsync()),t;}_read(e,t){t();}_push(e){this.done||(this._pushedCount++,this._buffer.push(e),this.readable=!0);}_fillBuffer(){var e;this._reading||(this.closed?this._completeClose():(e=Math.min(this._maxBufferSize-this._buffer.length,128))>0&&(this._pushedCount=0,this._reading=!0,this._read(e,()=>{if(!e)throw new Error("done callback called multiple times");e=0,this._reading=!1,this.closed?this._completeClose():this._pushedCount&&(this.readable=!0,this._buffer.length<this._maxBufferSize/2&&this._fillBufferAsync());})));}_fillBufferAsync(){this._reading||(this._reading=!0,a(()=>{this._reading=!1,this._fillBuffer();}));}close(){this._reading?this._changeState(h):this._completeClose();}_completeClose(){this._changeState(d)&&(this._reading=!0,this._flush(()=>{if(!this._reading)throw new Error("done callback called multiple times");this._reading=!1,this._buffer.length||this._endAsync();}));}_destroy(e,t){this._buffer=[],t();}_flush(e){e();}_toStringDetails(){var e=this._buffer,{length:t}=e;return "{"+(t?"next: "+e[0]+", ":"")+"buffer: "+t+"}";}}class E extends T{constructor(e,t){if(t===void 0){t=e||{};}super(t),this._boundPush=e=>this._push(e),H(e)||(e=t.source),this._sourceStarted=!1!==t.autoStart,U(e)?this.source=e:e&&(this._createSource=V(e)?()=>e:e,this._sourceStarted&&this._loadSourceAsync()),this._optional=Boolean(t.optional),this._destroySource=!1!==t.destroySource;}get source(){return q(this._createSource)&&this._loadSourceAsync(),this._source;}set source(e){var t=this._source=this._validateSource(e);t._destination=this,t.done?this.close():(t.on("end",O),t.on("readable",A),t.on("error",x));}_loadSourceAsync(){q(this._createSource)&&(Promise.resolve(this._createSource()).then(e=>{delete this._createSource,this.source=e,this._fillBuffer();},e=>this.emit("error",e)),this._createSource=null);}_validateSource(e,t){if(t===void 0){t=!1;}if(this._source||void 0!==this._createSource)throw new Error("The source cannot be changed after it has been set");if(!e||!q(e.read)||!q(e.on))throw new Error("Invalid source: "+e);if(!t&&e._destination)throw new Error("The source already has a destination");return e;}read(){return this._sourceStarted||(this._sourceStarted=!0),super.read();}_read(e,t){var r=()=>{this._pushedCount<e&&!this.closed?a(()=>this._readAndTransform(r,t)):t();};this._readAndTransform(r,t);}_readAndTransform(e,t){var r;var n=this.source;!n||n.done||null===(r=n.read())?t():this._optional?this._optionalTransform(r,e):this._transform(r,e,this._boundPush);}_optionalTransform(e,t){var r=this._pushedCount;this._transform(e,()=>{r===this._pushedCount&&this._push(e),t();},this._boundPush);}_transform(e,t,r){r(e),t();}_closeWhenDone(){this.close();}_end(e){var t=this._source;t&&(t.removeListener("end",O),t.removeListener("error",x),t.removeListener("readable",A),delete t._destination,this._destroySource&&t.destroy()),super._end(e);}}function x(e){this._destination.emit("error",e);}function O(){this._destination._closeWhenDone();}function A(){!1!==this._destination._sourceStarted&&this._destination._fillBuffer();}class R extends E{constructor(e,t){if(super(e,t),this._offset=0,this._limit=1/0,this._filter=e=>!0,t=t||(H(e)?null:e)){var _e3=q(t)?t:t.transform,{limit:_r5,offset:_n,filter:_i,map:_a,prepend:_s,append:_o}=t;_n===1/0||_r5===-1/0?this._limit=0:(Number.isFinite(_n)&&(this._offset=Math.max(Math.trunc(_n),0)),Number.isFinite(_r5)&&(this._limit=Math.max(Math.trunc(_r5),0)),q(_i)&&(this._filter=_i),q(_a)&&(this._map=_a),this._transform=q(_e3)?_e3:null),_s&&(this._prepender=U(_s)?_s:M(_s)),_o&&(this._appender=U(_o)?_o:M(_o));}}_read(e,t){var r=()=>this._readAndTransformSimple(e,n,t);function n(){a(r);}this._readAndTransformSimple(e,n,t);}_readAndTransformSimple(e,t,r){var n;var{source:i}=this;if(i&&!i.done){for(0===this._limit&&this.close();!this.closed&&this._pushedCount<e&&null!==(n=i.read());){if(!this._filter(n)||0!==this._offset&&this._offset--)continue;var _e4=void 0===this._map?n:this._map(n);if(null===_e4)this._optional&&this._push(n);else {if(q(this._transform))return void(this._optional?this._optionalTransform(_e4,t):this._transform(_e4,t,this._boundPush));this._push(_e4);}0==--this._limit&&this.close();}r();}else r();}_begin(e){this._insert(this._prepender,e),delete this._prepender;}_flush(e){this._insert(this._appender,e),delete this._appender;}_insert(e,t){var r=e=>this._push(e);!e||e.done?t():(e.on("data",r),e.on("end",function n(){e.removeListener("data",r),e.removeListener("end",n),t();}));}}class I extends E{constructor(e,t){if(super(e,t),this._transformerQueue=[],t){var _e5=q(t)?t:t.multiTransform;_e5&&(this._createTransformer=_e5);}}_read(e,t){var r=this._transformerQueue,n=this._optional;var i,a;for(;(i=r[0])&&i.transformer.done;){n&&null!==i.item&&(e--,this._push(i.item)),r.shift();var{transformer:_t3}=i;_t3.removeListener("end",A),_t3.removeListener("readable",A),_t3.removeListener("error",x);}var{source:s}=this;for(;s&&!s.done&&r.length<this.maxBufferSize&&(a=s.read(),null!==a);){var _e6=this._createTransformer(a)||new _();_e6._destination=this,_e6.on("end",A),_e6.on("readable",A),_e6.on("error",x),r.push({transformer:_e6,item:a});}if(i=r[0],i){var{transformer:_t4}=i;for(;e-->0&&null!==(a=_t4.read());){this._push(a),n&&(i.item=null);}}else s&&s.done&&this.close();t();}_createTransformer(e){return new v(e);}_closeWhenDone(){this._transformerQueue.length||this.close();}}class N extends T{constructor(e,t){if(t===void 0){t={};}super(t),this._sources=[],this._currentSource=-1;var r=!1!==t.autoStart;if(U(e))e.on("error",e=>this.emit("error",e)),this._pending={sources:e},r&&this._loadSources();else if(Array.isArray(e)&&e.length>0)for(var _t5 of e){this._addSource(_t5);}else r&&this.close();}_loadSources(){var e=this._pending.sources;delete this._pending.sources,e.done?(delete this._pending,this.close()):(e.on("data",e=>{this._addSource(e),this._fillBufferAsync();}),e.on("end",()=>{delete this._pending,this._fillBuffer();}));}_addSource(e){e.done||(this._sources.push(e),e._destination=this,e.on("error",x),e.on("readable",A),e.on("end",P));}_removeEmptySources(){this._sources=this._sources.filter((e,t)=>(e.done&&t<=this._currentSource&&this._currentSource--,!e.done)),this._fillBuffer();}_read(e,t){var r;(null===(r=this._pending)||void 0===r?void 0:r.sources)&&this._loadSources();var n,i=0;for(;i!==(i=e);){for(var _t6=0;_t6<this._sources.length&&e>0;_t6++){this._currentSource=(this._currentSource+1)%this._sources.length;null!==(n=this._sources[this._currentSource].read())&&(e--,this._push(n));}}this._pending||0!==this._sources.length||this.close(),t();}}function P(){this._destination._removeEmptySources();}class C extends E{constructor(e){super(e,{autoStart:!1}),this._readPosition=0,this._reading=!1;}_init(){}close(){g.prototype.close.call(this);}get source(){return super.source;}set source(e){var t=this._source=this._validateSource(e),r=t&&t._destination||(t._destination=new D(t));r.endsAt(0)?this.close():(r.register(this),null!==r.readAt(0)&&(this.readable=!0));var n=this._propertyCallbacks;for(var _e7 in n){var _t7=n[_e7];for(var _r6 of _t7){this._getSourceProperty(_e7,_r6);}}}_validateSource(e,t){var r=e&&e._destination;return super._validateSource(e,!r||r instanceof D);}getProperty(e,t){var{source:r}=this,n=this._properties,i=n&&e in n;if(!t)return i?n&&n[e]:r&&r.getProperty(e);super.getProperty(e,t),r&&!i&&this._getSourceProperty(e,t);}_getSourceProperty(e,t){this.source.getProperty(e,r=>{this._properties&&e in this._properties||t(r);});}getProperties(){var e=this.source?this.source.getProperties():{},t=this._properties;for(var _r7 in t){e[_r7]=t[_r7];}return e;}_toStringDetails(){return "{source: "+(this.source?this.source.toString():"none")+"}";}read(){var e=this.source;var t=null;if(!this.done&&e){var _r8=e._destination;null!==(t=_r8.readAt(this._readPosition))?this._readPosition++:this.readable=!1,_r8.endsAt(this._readPosition)&&this.close();}return t;}_end(e){var t=this.source,r=null==t?void 0:t._destination;r&&r.unregister(this),T.prototype._end.call(this,e);}}class D{constructor(e){if(this._clones=null,this._history=[],this._source=e,!e.done){var _t8=()=>{for(var _e8 of this._clones){_e8.readable=!0;}},_r9=e=>{for(var _t9 of this._clones){_t9.emit("error",e);}},_n2=()=>{for(var _e9 of this._clones){_e9._readPosition===this._history.length&&_e9.close();}this._clones=null,e.removeListener("end",_n2),e.removeListener("error",_r9),e.removeListener("readable",_t8);};this._clones=[],e.on("end",_n2),e.on("error",_r9),e.on("readable",_t8);}}register(e){null!==this._clones&&this._clones.push(e);}unregister(e){null!==this._clones&&(this._clones=this._clones.filter(t=>t!==e));}readAt(e){var t=null;return e<this._history.length?t=this._history[e]:this._source.done||null===(t=this._source.read())||(this._history[e]=t),t;}endsAt(e){return this._source.done&&this._history.length===e;}}function j(e,t){return new E(e,t);}function k(){return new _();}function L(e){return new v(e);}function M(e){return new w(e);}function F(e){return new N(e);}function B(e,t,r){return new S({start:e,end:t,step:r});}function q(e){return "function"==typeof e;}function U(e){return e&&"function"==typeof e.on;}function V(e){return e&&"function"==typeof e.then;}function H(e){return e&&(U(e)||V(e)||q(e));}},function(e,t,r){Object.defineProperty(t,"__esModule",{value:!0}),t.termToString=t.stringToTerm=t.stringQuadToQuad=t.quadToStringQuad=t.getLiteralValue=t.getLiteralType=t.getLiteralLanguage=void 0;var n=r(198);Object.defineProperty(t,"getLiteralLanguage",{enumerable:!0,get:function get(){return n.getLiteralLanguage;}}),Object.defineProperty(t,"getLiteralType",{enumerable:!0,get:function get(){return n.getLiteralType;}}),Object.defineProperty(t,"getLiteralValue",{enumerable:!0,get:function get(){return n.getLiteralValue;}}),Object.defineProperty(t,"quadToStringQuad",{enumerable:!0,get:function get(){return n.quadToStringQuad;}}),Object.defineProperty(t,"stringQuadToQuad",{enumerable:!0,get:function get(){return n.stringQuadToQuad;}}),Object.defineProperty(t,"stringToTerm",{enumerable:!0,get:function get(){return n.stringToTerm;}}),Object.defineProperty(t,"termToString",{enumerable:!0,get:function get(){return n.termToString;}});},function(e,t,r){var n=this&&this.__createBinding||(Object.create?function(e,t,r,n){void 0===n&&(n=r),Object.defineProperty(e,n,{enumerable:!0,get:function get(){return t[r];}});}:function(e,t,r,n){void 0===n&&(n=r),e[n]=t[r];}),i=this&&this.__exportStar||function(e,t){for(var r in e){"default"===r||Object.prototype.hasOwnProperty.call(t,r)||n(t,e,r);}};Object.defineProperty(t,"__esModule",{value:!0}),i(r(96),t),i(r(199),t),i(r(97),t),i(r(98),t),i(r(68),t),i(r(99),t),i(r(100),t);},function(e,t,r){Object.defineProperty(t,"__esModule",{value:!0}),t.Util=t.toSparqlJs=t.toSparql=t.Factory=t.Algebra=t.translate=void 0;var n=r(200);t.translate=n.default;var i=r(52);t.Algebra=i;var a=r(53);t.Factory=a.default;var s=r(216);Object.defineProperty(t,"toSparql",{enumerable:!0,get:function get(){return s.toSparql;}}),Object.defineProperty(t,"toSparqlJs",{enumerable:!0,get:function get(){return s.toSparqlJs;}});var o=r(70);t.Util=o.default;},function(e,t,r){var n="http://www.w3.org/1999/02/22-rdf-syntax-ns#",i="http://www.w3.org/2001/XMLSchema#",a="http://www.w3.org/2000/10/swap/";t.a={xsd:{decimal:i+"decimal",boolean:i+"boolean",double:i+"double",integer:i+"integer",string:i+"string"},rdf:{type:n+"type",nil:n+"nil",first:n+"first",rest:n+"rest",langString:n+"langString"},owl:{sameAs:"http://www.w3.org/2002/07/owl#sameAs"},r:{forSome:a+"reify#forSome",forAll:a+"reify#forAll"},log:{implies:a+"log#implies"}};},function(e,t){var r,n,i=e.exports={};function a(){throw new Error("setTimeout has not been defined");}function s(){throw new Error("clearTimeout has not been defined");}function o(e){if(r===setTimeout)return setTimeout(e,0);if((r===a||!r)&&setTimeout)return r=setTimeout,setTimeout(e,0);try{return r(e,0);}catch(t){try{return r.call(null,e,0);}catch(t){return r.call(this,e,0);}}}!function(){try{r="function"==typeof setTimeout?setTimeout:a;}catch(e){r=a;}try{n="function"==typeof clearTimeout?clearTimeout:s;}catch(e){n=s;}}();var u,c=[],l=!1,h=-1;function d(){l&&u&&(l=!1,u.length?c=u.concat(c):h=-1,c.length&&p());}function p(){if(!l){var e=o(d);l=!0;for(var t=c.length;t;){for(u=c,c=[];++h<t;){u&&u[h].run();}h=-1,t=c.length;}u=null,l=!1,function(e){if(n===clearTimeout)return clearTimeout(e);if((n===s||!n)&&clearTimeout)return n=clearTimeout,clearTimeout(e);try{n(e);}catch(t){try{return n.call(null,e);}catch(t){return n.call(this,e);}}}(e);}}function f(e,t){this.fun=e,this.array=t;}function g(){}i.nextTick=function(e){var t=new Array(arguments.length-1);if(arguments.length>1)for(var r=1;r<arguments.length;r++){t[r-1]=arguments[r];}c.push(new f(e,t)),1!==c.length||l||o(p);},f.prototype.run=function(){this.fun.apply(null,this.array);},i.title="browser",i.browser=!0,i.env={},i.argv=[],i.version="",i.versions={},i.on=g,i.addListener=g,i.once=g,i.off=g,i.removeListener=g,i.removeAllListeners=g,i.emit=g,i.prependListener=g,i.prependOnceListener=g,i.listeners=function(e){return [];},i.binding=function(e){throw new Error("process.binding is not supported");},i.cwd=function(){return "/";},i.chdir=function(e){throw new Error("process.chdir is not supported");},i.umask=function(){return 0;};},function(e,t,r){var n=this&&this.__createBinding||(Object.create?function(e,t,r,n){void 0===n&&(n=r),Object.defineProperty(e,n,{enumerable:!0,get:function get(){return t[r];}});}:function(e,t,r,n){void 0===n&&(n=r),e[n]=t[r];}),i=this&&this.__exportStar||function(e,t){for(var r in e){"default"===r||Object.prototype.hasOwnProperty.call(t,r)||n(t,e,r);}};Object.defineProperty(t,"__esModule",{value:!0}),i(r(149),t),i(r(47),t),i(r(150),t),i(r(333),t),i(r(334),t),i(r(152),t),i(r(83),t);},function(e,t){var r;r=function(){return this;}();try{r=r||new Function("return this")();}catch(e){"object"==typeof window&&(r=window);}e.exports=r;},function(e,t,r){(function(e){/*!
             * The buffer module from node.js, for the browser.
             *
             * @author   Feross Aboukhadijeh <http://feross.org>
             * @license  MIT

    var newEngine = Comunica$1.newEngine;

    /**
     * A proxy handler that prefixes all URLs with a given string.
     */
    class ProxyHandlerStatic {
      constructor(prefixUrl) {
        this.prefixUrl = prefixUrl;
      }

      getProxy(request) {
        var _this = this;

        return _asyncToGenerator(function* () {
          return {
            init: request.init,
            input: _this.modifyInput(request.input)
          };
        })();
      }

      modifyInput(input) {
        if (typeof input === 'string') {
          return this.prefixUrl + input;
        }

        return new Request(this.prefixUrl + input.url, input);
      }

    }

    function sparqlQueryToList(_x, _x2, _x3) {
      return _sparqlQueryToList.apply(this, arguments);
    }

    function _sparqlQueryToList() {
      _sparqlQueryToList = _asyncToGenerator(function* (query, source, proxy) {
        if (proxy === void 0) {
          proxy = undefined;
        }

        query = query.toString().replace(/LANGUAGE/g, Language.uiLanguage);
        if (typeof source === 'object' && source instanceof String) source = source.toString();
        if (typeof source === 'string') source.replace('http:', location.protocol);
        var options = {
          sources: [source],
          httpProxyHandler: null
        };
        if (proxy) options.httpProxyHandler = new ProxyHandlerStatic(proxy);
        var engine = newEngine();
        var result = yield engine.query(query, options);
        var bindings = yield result.bindings();
        var items = new Map();

        for (var binding of bindings) {
          var _binding$get$id, _binding$get, _binding$get2, _binding$get3, _binding$get4, _binding$get5;

          var label = (_binding$get$id = (_binding$get = binding.get('?label')) == null ? void 0 : _binding$get.id) != null ? _binding$get$id : (_binding$get2 = binding.get('?label')) == null ? void 0 : _binding$get2.value;
          var valueAndLanguage = label.split('@');

          if (label[0] === '"' && label[label.length - 1] === '"') {
            label = label.substr(1, label.length - 2);
          }

          if (valueAndLanguage.length > 1) {
            label = {};
            label[valueAndLanguage[1].trim('"')] = valueAndLanguage[0].slice(1, -1);
          }

          var uri = (_binding$get3 = binding.get('?uri')) == null ? void 0 : _binding$get3.value;
          var image = (_binding$get4 = binding.get('?image')) == null ? void 0 : _binding$get4.value;
          var group = (_binding$get5 = binding.get('?group')) == null ? void 0 : _binding$get5.value;

          if (!items.get(uri)) {
            items.set(uri, {
              label,
              uri,
              image,
              group
            });
          } else {
            var existingItem = items.get(uri);

            if (typeof existingItem.label === 'string' && typeof label === 'string') {
              existingItem.label = label;
            } else {
              Object.assign(existingItem.label, label);
            }

            items.set(uri, existingItem);
          }
        }

        return [...items.values()];
      });
      return _sparqlQueryToList.apply(this, arguments);
    }

    function onlyUnique(value, index, self) {
      return self.indexOf(value) === index && value;
    }

    var _templateObject$4, _templateObject2$2, _templateObject3$2, _templateObject4$2, _templateObject5$2, _templateObject6$1, _templateObject7$1, _templateObject8$1, _templateObject9$1, _templateObject10$1;
    class Dropdown extends ElementBase {
      constructor() {
        super(...arguments);
        this.form.dispatchEvent(new CustomEvent('dropdown-options', {
          detail: {
            options: this.options,
            element: this
          }
        }));

        if (!this.options.length) {
          var _this$definition$form, _this$definition$form2;

          if (!((_this$definition$form = this.definition['form:optionsQuery']) != null && _this$definition$form._) || !((_this$definition$form2 = this.definition['form:optionsSource']) != null && _this$definition$form2._)) {
            throw new Error('optionsQuery and optionsSource are needed for the field dropdown. Please improve the form definition.');
          }
        }
      }

      removeButton() {
        var _this$definition$form3;

        var isMultiple = (_this$definition$form3 = this.definition['form:multiple']) == null ? void 0 : _this$definition$form3._;
        return isMultiple ? null : super.removeButton();
      }

      item(childTemplates) {
        var _this$definition$form4;

        if (childTemplates === void 0) {
          childTemplates = [];
        }

        return ((_this$definition$form4 = this.definition['form:multiple']) == null ? void 0 : _this$definition$form4._) !== true || this.index < 1 ? super.item(childTemplates) : html(_templateObject$4 || (_templateObject$4 = _taggedTemplateLiteralLoose([""])));
      }

      on(event) {
        if (['keyup', 'change'].includes(event.type)) {
          var selectedItems = event.target.options ? [...event.target.options].filter(option => option.selected) : [...event.target.parentElement.parentElement.querySelectorAll(':checked')];
          var selectedValues = selectedItems.map(option => {
            return {
              ['@' + this.jsonldKey]: option.value
            };
          });
          if (!this.parentValues[this.mainBinding]) this.parentValues[this.mainBinding] = [];
          this.parentValues[this.mainBinding].splice(0);
          this.parentValues[this.mainBinding].push(...selectedValues);
          this.dispatchChange();
        }
      }

      input() {
        var _this = this;

        return _asyncToGenerator(function* () {
          var _this$definition$form5, _this$definition$form6, _this$parentValues$_t, _this$parentValues, _this$parentValues$_t2, _this$definition$form8, _this$value, _this$definition$form9;

          if (!_this.options.length && (_this$definition$form5 = _this.definition['form:optionsQuery']) != null && _this$definition$form5._ && (_this$definition$form6 = _this.definition['form:optionsSource']) != null && _this$definition$form6._) {
            var _this$form$getAttribu, _this$definition$form7;

            var proxy = (_this$form$getAttribu = _this.form.getAttribute('proxy')) != null ? _this$form$getAttribu : '';
            var source = (_this$definition$form7 = _this.definition['form:optionsSourceType']) != null && _this$definition$form7._ ? {
              value: _this.definition['form:optionsSource']._,
              type: _this.definition['form:optionsSourceType']._
            } : _this.definition['form:optionsSource']._;
            _this.options = yield sparqlQueryToList(_this.definition['form:optionsQuery']._, source, proxy);
          }

          var selectedValues = (_this$parentValues$_t = (_this$parentValues = _this.parentValues) == null ? void 0 : (_this$parentValues$_t2 = _this$parentValues[_this.mainBinding]) == null ? void 0 : _this$parentValues$_t2.map(option => option['@' + _this.jsonldKey])) != null ? _this$parentValues$_t : [];
          var isMultiple = (_this$definition$form8 = _this.definition['form:multiple']) == null ? void 0 : _this$definition$form8._;

          var hasGroups = _this.options.every(item => item == null ? void 0 : item.group);

          var groups = hasGroups ? _this.options.map(item => item == null ? void 0 : item.group).filter(onlyUnique).sort() : [];

          var createGroup = groupName => {
            var options = _this.options.filter(option => option.group === groupName);

            return html(_templateObject2$2 || (_templateObject2$2 = _taggedTemplateLiteralLoose(["\n      <h3>", "</h3>\n      ", "\n      "])), groupName, options.map(createCheckbox));
          };

          var createCheckbox = option => {
            var _ref, _option$label$Languag, _option$label;

            return html(_templateObject3$2 || (_templateObject3$2 = _taggedTemplateLiteralLoose(["\n    <label class=\"checkbox-label\">\n      <input type=\"checkbox\" onchange=", " value=\"", "\" .checked=\"", "\" />\n      ", "\n    </label>\n    "])), event => _this.on(event), option.uri, selectedValues.includes(option.uri) ? true : null, (_ref = (_option$label$Languag = option == null ? void 0 : (_option$label = option.label) == null ? void 0 : _option$label[Language.uiLanguage]) != null ? _option$label$Languag : option == null ? void 0 : option.label) != null ? _ref : '');
          };

          return isMultiple ? hasGroups ? html(_templateObject4$2 || (_templateObject4$2 = _taggedTemplateLiteralLoose(["", ""])), groups.map(createGroup)) : html(_templateObject5$2 || (_templateObject5$2 = _taggedTemplateLiteralLoose(["", ""])), _this.options.map(createCheckbox)) : html(_templateObject6$1 || (_templateObject6$1 = _taggedTemplateLiteralLoose(["\n    <select\n      ref=", " \n      onchange=", "\n    >\n        ", "\n\n        ", "\n    </select>"])), attributesDiff(_this.attributes), event => _this.on(event), !((_this$value = _this.value) != null && _this$value._) && !((_this$definition$form9 = _this.definition['form:multiple']) != null && _this$definition$form9._) ? html(_templateObject7$1 || (_templateObject7$1 = _taggedTemplateLiteralLoose(["<option disabled selected value>", "</option>"])), _this.t(_templateObject8$1 || (_templateObject8$1 = _taggedTemplateLiteralLoose(["- Select a value -"])))) : '', _this.options.map(option => {
            var _ref2, _option$label$Languag2, _option$label2;

            return html(_templateObject9$1 || (_templateObject9$1 = _taggedTemplateLiteralLoose(["\n          <option value=\"", "\" .selected=\"", "\">\n              ", "\n            </option>\n          "])), option.uri, selectedValues.includes(option.uri) ? true : null, (_ref2 = (_option$label$Languag2 = option == null ? void 0 : (_option$label2 = option.label) == null ? void 0 : _option$label2[Language.uiLanguage]) != null ? _option$label$Languag2 : option == null ? void 0 : option.label) != null ? _ref2 : '');
          }));
        })();
      }

      addButton() {
        return html(_templateObject10$1 || (_templateObject10$1 = _taggedTemplateLiteralLoose([""])));
      }

    }

    var _templateObject$5;
    class Group extends ElementBase {
      constructor() {
        super(...arguments);

        if (!this.value) {
          this.addItem();
          this.removeItem();
        }
      }

      item(childTemplates) {
        if (childTemplates === void 0) {
          childTemplates = [];
        }

        return html(_templateObject$5 || (_templateObject$5 = _taggedTemplateLiteralLoose(["\n    <div class=\"item\">\n    ", "\n    ", "\n    </div>"])), childTemplates, this.removeButton());
      }

    }

    var SlimSelect = /*#__PURE__*/function webpackUniversalModuleDefinition(root, factory) {
      return factory();
    }(window, function () {
      return (
        /******/
        function (modules) {
          // webpackBootstrap

          /******/
          // The module cache

          /******/
          var installedModules = {};
          /******/

          /******/
          // The require function

          /******/

          function __webpack_require__(moduleId) {
            /******/

            /******/
            // Check if module is in cache

            /******/
            if (installedModules[moduleId]) {
              /******/
              return installedModules[moduleId].exports;
              /******/
            }
            /******/
            // Create a new module (and put it into the cache)

            /******/


            var module = installedModules[moduleId] = {
              /******/
              i: moduleId,

              /******/
              l: false,

              /******/
              exports: {}
              /******/

            };
            /******/

            /******/
            // Execute the module function

            /******/

            modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
            /******/

            /******/
            // Flag the module as loaded

            /******/

            module.l = true;
            /******/

            /******/
            // Return the exports of the module

            /******/

            return module.exports;
            /******/
          }
          /******/

          /******/

          /******/
          // expose the modules object (__webpack_modules__)

          /******/


          __webpack_require__.m = modules;
          /******/

          /******/
          // expose the module cache

          /******/

          __webpack_require__.c = installedModules;
          /******/

          /******/
          // define getter function for harmony exports

          /******/

          __webpack_require__.d = function (exports, name, getter) {
            /******/
            if (!__webpack_require__.o(exports, name)) {
              /******/
              Object.defineProperty(exports, name, {
                enumerable: true,
                get: getter
              });
              /******/
            }
            /******/

          };
          /******/

          /******/
          // define __esModule on exports

          /******/


          __webpack_require__.r = function (exports) {
            /******/
            if (typeof Symbol !== 'undefined' && Symbol.toStringTag) {
              /******/
              Object.defineProperty(exports, Symbol.toStringTag, {
                value: 'Module'
              });
              /******/
            }
            /******/


            Object.defineProperty(exports, '__esModule', {
              value: true
            });
            /******/
          };
          /******/

          /******/
          // create a fake namespace object

          /******/
          // mode & 1: value is a module id, require it

          /******/
          // mode & 2: merge all properties of value into the ns

          /******/
          // mode & 4: return value when already ns object

          /******/
          // mode & 8|1: behave like require

          /******/


          __webpack_require__.t = function (value, mode) {
            /******/
            if (mode & 1) value = __webpack_require__(value);
            /******/

            if (mode & 8) return value;
            /******/

            if (mode & 4 && typeof value === 'object' && value && value.__esModule) return value;
            /******/

            var ns = Object.create(null);
            /******/

            __webpack_require__.r(ns);
            /******/


            Object.defineProperty(ns, 'default', {
              enumerable: true,
              value: value
            });
            /******/

            if (mode & 2 && typeof value != 'string') for (var key in value) {
              __webpack_require__.d(ns, key, function (key) {
                return value[key];
              }.bind(null, key));
            }
            /******/

            return ns;
            /******/
          };
          /******/

          /******/
          // getDefaultExport function for compatibility with non-harmony modules

          /******/


          __webpack_require__.n = function (module) {
            /******/
            var getter = module && module.__esModule ?
            /******/
            function getDefault() {
              return module['default'];
            } :
            /******/
            function getModuleExports() {
              return module;
            };
            /******/

            __webpack_require__.d(getter, 'a', getter);
            /******/


            return getter;
            /******/
          };
          /******/

          /******/
          // Object.prototype.hasOwnProperty.call

          /******/


          __webpack_require__.o = function (object, property) {
            return Object.prototype.hasOwnProperty.call(object, property);
          };
          /******/

          /******/
          // __webpack_public_path__

          /******/


          __webpack_require__.p = "";
          /******/

          /******/

          /******/
          // Load entry module and return exports

          /******/

          return __webpack_require__(__webpack_require__.s = 2);
          /******/
        }
        /************************************************************************/

        /******/
        ([
        /* 0 */

        /***/
        function (module, exports, __webpack_require__) {

          exports.__esModule = true;

          function hasClassInTree(element, className) {
            function hasClass(e, c) {
              if (!(!c || !e || !e.classList || !e.classList.contains(c))) {
                return e;
              }

              return null;
            }

            function parentByClass(e, c) {
              if (!e || e === document) {
                return null;
              } else if (hasClass(e, c)) {
                return e;
              } else {
                return parentByClass(e.parentNode, c);
              }
            }

            return hasClass(element, className) || parentByClass(element, className);
          }

          exports.hasClassInTree = hasClassInTree;

          function ensureElementInView(container, element) {
            var cTop = container.scrollTop + container.offsetTop;
            var cBottom = cTop + container.clientHeight;
            var eTop = element.offsetTop;
            var eBottom = eTop + element.clientHeight;

            if (eTop < cTop) {
              container.scrollTop -= cTop - eTop;
            } else if (eBottom > cBottom) {
              container.scrollTop += eBottom - cBottom;
            }
          }

          exports.ensureElementInView = ensureElementInView;

          function putContent(el, currentPosition, isOpen) {
            var height = el.offsetHeight;
            var rect = el.getBoundingClientRect();
            var elemTop = isOpen ? rect.top : rect.top - height;
            var elemBottom = isOpen ? rect.bottom : rect.bottom + height;

            if (elemTop <= 0) {
              return 'below';
            }

            if (elemBottom >= window.innerHeight) {
              return 'above';
            }

            return isOpen ? currentPosition : 'below';
          }

          exports.putContent = putContent;

          function debounce(func, wait, immediate) {
            if (wait === void 0) {
              wait = 100;
            }

            if (immediate === void 0) {
              immediate = false;
            }

            var timeout;
            return function () {
              var args = [];

              for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
              }

              var context = self;

              var later = function later() {
                timeout = null;

                if (!immediate) {
                  func.apply(context, args);
                }
              };

              var callNow = immediate && !timeout;
              clearTimeout(timeout);
              timeout = setTimeout(later, wait);

              if (callNow) {
                func.apply(context, args);
              }
            };
          }

          exports.debounce = debounce;

          function isValueInArrayOfObjects(selected, key, value) {
            if (!Array.isArray(selected)) {
              return selected[key] === value;
            }

            for (var _i = 0, selected_1 = selected; _i < selected_1.length; _i++) {
              var s = selected_1[_i];

              if (s && s[key] && s[key] === value) {
                return true;
              }
            }

            return false;
          }

          exports.isValueInArrayOfObjects = isValueInArrayOfObjects;

          function highlight(str, search, className) {
            var completedString = str;
            var regex = new RegExp('(' + search.trim() + ')(?![^<]*>[^<>]*</)', 'i');

            if (!str.match(regex)) {
              return str;
            }

            var matchStartPosition = str.match(regex).index;
            var matchEndPosition = matchStartPosition + str.match(regex)[0].toString().length;
            var originalTextFoundByRegex = str.substring(matchStartPosition, matchEndPosition);
            completedString = completedString.replace(regex, "<mark class=\"" + className + "\">" + originalTextFoundByRegex + "</mark>");
            return completedString;
          }

          exports.highlight = highlight;

          function kebabCase(str) {
            var result = str.replace(/[A-Z\u00C0-\u00D6\u00D8-\u00DE]/g, function (match) {
              return '-' + match.toLowerCase();
            });
            return str[0] === str[0].toUpperCase() ? result.substring(1) : result;
          }

          exports.kebabCase = kebabCase;
          /***/

        },
        /* 1 */

        /***/
        function (module, exports, __webpack_require__) {

          exports.__esModule = true;

          var Data = function () {
            function Data(info) {
              this.contentOpen = false;
              this.contentPosition = 'below';
              this.isOnChangeEnabled = true;
              this.main = info.main;
              this.searchValue = '';
              this.data = [];
              this.filtered = null;
              this.parseSelectData();
              this.setSelectedFromSelect();
            }

            Data.prototype.newOption = function (info) {
              return {
                id: info.id ? info.id : String(Math.floor(Math.random() * 100000000)),
                value: info.value ? info.value : '',
                text: info.text ? info.text : '',
                innerHTML: info.innerHTML ? info.innerHTML : '',
                selected: info.selected ? info.selected : false,
                display: info.display !== undefined ? info.display : true,
                disabled: info.disabled ? info.disabled : false,
                placeholder: info.placeholder ? info.placeholder : false,
                "class": info["class"] ? info["class"] : undefined,
                data: info.data ? info.data : {},
                mandatory: info.mandatory ? info.mandatory : false
              };
            };

            Data.prototype.add = function (data) {
              this.data.push({
                id: String(Math.floor(Math.random() * 100000000)),
                value: data.value,
                text: data.text,
                innerHTML: '',
                selected: false,
                display: true,
                disabled: false,
                placeholder: false,
                "class": undefined,
                mandatory: data.mandatory,
                data: {}
              });
            };

            Data.prototype.parseSelectData = function () {
              this.data = [];
              var nodes = this.main.select.element.childNodes;

              for (var _i = 0, nodes_1 = nodes; _i < nodes_1.length; _i++) {
                var n = nodes_1[_i];

                if (n.nodeName === 'OPTGROUP') {
                  var node = n;
                  var optgroup = {
                    label: node.label,
                    options: []
                  };
                  var options = n.childNodes;

                  for (var _a = 0, options_1 = options; _a < options_1.length; _a++) {
                    var o = options_1[_a];

                    if (o.nodeName === 'OPTION') {
                      var option = this.pullOptionData(o);
                      optgroup.options.push(option);

                      if (option.placeholder && option.text.trim() !== '') {
                        this.main.config.placeholderText = option.text;
                      }
                    }
                  }

                  this.data.push(optgroup);
                } else if (n.nodeName === 'OPTION') {
                  var option = this.pullOptionData(n);
                  this.data.push(option);

                  if (option.placeholder && option.text.trim() !== '') {
                    this.main.config.placeholderText = option.text;
                  }
                }
              }
            };

            Data.prototype.pullOptionData = function (option) {
              return {
                id: (option.dataset ? option.dataset.id : false) || String(Math.floor(Math.random() * 100000000)),
                value: option.value,
                text: option.text,
                innerHTML: option.innerHTML,
                selected: option.selected,
                disabled: option.disabled,
                placeholder: option.dataset.placeholder === 'true',
                "class": option.className,
                style: option.style.cssText,
                data: option.dataset,
                mandatory: option.dataset ? option.dataset.mandatory === 'true' : false
              };
            };

            Data.prototype.setSelectedFromSelect = function () {
              if (this.main.config.isMultiple) {
                var options = this.main.select.element.options;
                var newSelected = [];

                for (var _i = 0, options_2 = options; _i < options_2.length; _i++) {
                  var o = options_2[_i];

                  if (o.selected) {
                    var newOption = this.getObjectFromData(o.value, 'value');

                    if (newOption && newOption.id) {
                      newSelected.push(newOption.id);
                    }
                  }
                }

                this.setSelected(newSelected, 'id');
              } else {
                var element = this.main.select.element;

                if (element.selectedIndex !== -1) {
                  var option = element.options[element.selectedIndex];
                  var value = option.value;
                  this.setSelected(value, 'value');
                }
              }
            };

            Data.prototype.setSelected = function (value, type) {
              if (type === void 0) {
                type = 'id';
              }

              for (var _i = 0, _a = this.data; _i < _a.length; _i++) {
                var d = _a[_i];

                if (d.hasOwnProperty('label')) {
                  if (d.hasOwnProperty('options')) {
                    var options = d.options;

                    if (options) {
                      for (var _b = 0, options_3 = options; _b < options_3.length; _b++) {
                        var o = options_3[_b];

                        if (o.placeholder) {
                          continue;
                        }

                        o.selected = this.shouldBeSelected(o, value, type);
                      }
                    }
                  }
                } else {
                  d.selected = this.shouldBeSelected(d, value, type);
                }
              }
            };

            Data.prototype.shouldBeSelected = function (option, value, type) {
              if (type === void 0) {
                type = 'id';
              }

              if (Array.isArray(value)) {
                for (var _i = 0, value_1 = value; _i < value_1.length; _i++) {
                  var v = value_1[_i];

                  if (type in option && String(option[type]) === String(v)) {
                    return true;
                  }
                }
              } else {
                if (type in option && String(option[type]) === String(value)) {
                  return true;
                }
              }

              return false;
            };

            Data.prototype.getSelected = function () {
              var value = {
                text: '',
                placeholder: this.main.config.placeholderText
              };
              var values = [];

              for (var _i = 0, _a = this.data; _i < _a.length; _i++) {
                var d = _a[_i];

                if (d.hasOwnProperty('label')) {
                  if (d.hasOwnProperty('options')) {
                    var options = d.options;

                    if (options) {
                      for (var _b = 0, options_4 = options; _b < options_4.length; _b++) {
                        var o = options_4[_b];

                        if (o.selected) {
                          if (!this.main.config.isMultiple) {
                            value = o;
                          } else {
                            values.push(o);
                          }
                        }
                      }
                    }
                  }
                } else {
                  if (d.selected) {
                    if (!this.main.config.isMultiple) {
                      value = d;
                    } else {
                      values.push(d);
                    }
                  }
                }
              }

              if (this.main.config.isMultiple) {
                return values;
              }

              return value;
            };

            Data.prototype.addToSelected = function (value, type) {
              if (type === void 0) {
                type = 'id';
              }

              if (this.main.config.isMultiple) {
                var values = [];
                var selected = this.getSelected();

                if (Array.isArray(selected)) {
                  for (var _i = 0, selected_1 = selected; _i < selected_1.length; _i++) {
                    var s = selected_1[_i];
                    values.push(s[type]);
                  }
                }

                values.push(value);
                this.setSelected(values, type);
              }
            };

            Data.prototype.removeFromSelected = function (value, type) {
              if (type === void 0) {
                type = 'id';
              }

              if (this.main.config.isMultiple) {
                var values = [];
                var selected = this.getSelected();

                for (var _i = 0, selected_2 = selected; _i < selected_2.length; _i++) {
                  var s = selected_2[_i];

                  if (String(s[type]) !== String(value)) {
                    values.push(s[type]);
                  }
                }

                this.setSelected(values, type);
              }
            };

            Data.prototype.onDataChange = function () {
              if (this.main.onChange && this.isOnChangeEnabled) {
                this.main.onChange(JSON.parse(JSON.stringify(this.getSelected())));
              }
            };

            Data.prototype.getObjectFromData = function (value, type) {
              if (type === void 0) {
                type = 'id';
              }

              for (var _i = 0, _a = this.data; _i < _a.length; _i++) {
                var d = _a[_i];

                if (type in d && String(d[type]) === String(value)) {
                  return d;
                }

                if (d.hasOwnProperty('options')) {
                  var optgroupObject = d;

                  if (optgroupObject.options) {
                    for (var _b = 0, _c = optgroupObject.options; _b < _c.length; _b++) {
                      var oo = _c[_b];

                      if (String(oo[type]) === String(value)) {
                        return oo;
                      }
                    }
                  }
                }
              }

              return null;
            };

            Data.prototype.search = function (search) {
              this.searchValue = search;

              if (search.trim() === '') {
                this.filtered = null;
                return;
              }

              var searchFilter = this.main.config.searchFilter;
              var valuesArray = this.data.slice(0);
              search = search.trim();
              var filtered = valuesArray.map(function (obj) {
                if (obj.hasOwnProperty('options')) {
                  var optgroupObj = obj;
                  var options = [];

                  if (optgroupObj.options) {
                    options = optgroupObj.options.filter(function (opt) {
                      return searchFilter(opt, search);
                    });
                  }

                  if (options.length !== 0) {
                    var optgroup = Object.assign({}, optgroupObj);
                    optgroup.options = options;
                    return optgroup;
                  }
                }

                if (obj.hasOwnProperty('text')) {
                  var optionObj = obj;

                  if (searchFilter(optionObj, search)) {
                    return obj;
                  }
                }

                return null;
              });
              this.filtered = filtered.filter(function (info) {
                return info;
              });
            };

            return Data;
          }();

          exports.Data = Data;

          function validateData(data) {
            if (!data) {
              console.error('Data must be an array of objects');
              return false;
            }

            var isValid = false;
            var errorCount = 0;

            for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
              var d = data_1[_i];

              if (d.hasOwnProperty('label')) {
                if (d.hasOwnProperty('options')) {
                  var optgroup = d;
                  var options = optgroup.options;

                  if (options) {
                    for (var _a = 0, options_5 = options; _a < options_5.length; _a++) {
                      var o = options_5[_a];
                      isValid = validateOption(o);

                      if (!isValid) {
                        errorCount++;
                      }
                    }
                  }
                }
              } else {
                var option = d;
                isValid = validateOption(option);

                if (!isValid) {
                  errorCount++;
                }
              }
            }

            return errorCount === 0;
          }

          exports.validateData = validateData;

          function validateOption(option) {
            if (option.text === undefined) {
              console.error('Data object option must have at least have a text value. Check object: ' + JSON.stringify(option));
              return false;
            }

            return true;
          }

          exports.validateOption = validateOption;
          /***/
        },
        /* 2 */

        /***/
        function (module, exports, __webpack_require__) {

          exports.__esModule = true;

          var config_1 = __webpack_require__(3);

          var select_1 = __webpack_require__(4);

          var slim_1 = __webpack_require__(5);

          var data_1 = __webpack_require__(1);

          var helper_1 = __webpack_require__(0);

          var SlimSelect = function () {
            function SlimSelect(info) {
              var _this = this;

              this.ajax = null;
              this.addable = null;
              this.beforeOnChange = null;
              this.onChange = null;
              this.addedData = [];
              this.beforeOpen = null;
              this.afterOpen = null;
              this.beforeClose = null;
              this.afterClose = null;
              this.windowScroll = helper_1.debounce(function (e) {
                if (_this.data.contentOpen) {
                  if (helper_1.putContent(_this.slim.content, _this.data.contentPosition, _this.data.contentOpen) === 'above') {
                    _this.moveContentAbove();
                  } else {
                    _this.moveContentBelow();
                  }
                }
              });

              this.documentClick = function (e) {
                if (e.target && !helper_1.hasClassInTree(e.target, _this.config.id)) {
                  _this.close();
                }
              };

              var selectElement = this.validate(info);

              if (selectElement.dataset.ssid) {
                this.destroy(selectElement.dataset.ssid);
              }

              if (info.ajax) {
                this.ajax = info.ajax;
              }

              if (info.addable) {
                this.addable = info.addable;
              }

              this.config = new config_1.Config({
                select: selectElement,
                isAjax: info.ajax ? true : false,
                showSearch: info.showSearch,
                searchPlaceholder: info.searchPlaceholder,
                searchText: info.searchText,
                searchingText: info.searchingText,
                searchFocus: info.searchFocus,
                searchHighlight: info.searchHighlight,
                searchFilter: info.searchFilter,
                closeOnSelect: info.closeOnSelect,
                showContent: info.showContent,
                placeholderText: info.placeholder,
                allowDeselect: info.allowDeselect,
                allowDeselectOption: info.allowDeselectOption,
                hideSelectedOption: info.hideSelectedOption,
                deselectLabel: info.deselectLabel,
                isEnabled: info.isEnabled,
                valuesUseText: info.valuesUseText,
                showOptionTooltips: info.showOptionTooltips,
                selectByGroup: info.selectByGroup,
                limit: info.limit,
                timeoutDelay: info.timeoutDelay,
                addToBody: info.addToBody
              });
              this.select = new select_1.Select({
                select: selectElement,
                main: this
              });
              this.data = new data_1.Data({
                main: this
              });
              this.slim = new slim_1.Slim({
                main: this
              });

              if (this.select.element.parentNode) {
                this.select.element.parentNode.insertBefore(this.slim.container, this.select.element.nextSibling);
              }

              if (info.data) {
                this.setData(info.data);
              } else {
                this.render();
              }

              document.addEventListener('click', this.documentClick);

              if (this.config.showContent === 'auto') {
                window.addEventListener('scroll', this.windowScroll, false);
              }

              if (info.beforeOnChange) {
                this.beforeOnChange = info.beforeOnChange;
              }

              if (info.onChange) {
                this.onChange = info.onChange;
              }

              if (info.beforeOpen) {
                this.beforeOpen = info.beforeOpen;
              }

              if (info.afterOpen) {
                this.afterOpen = info.afterOpen;
              }

              if (info.beforeClose) {
                this.beforeClose = info.beforeClose;
              }

              if (info.afterClose) {
                this.afterClose = info.afterClose;
              }

              if (!this.config.isEnabled) {
                this.disable();
              }
            }

            SlimSelect.prototype.validate = function (info) {
              var select = typeof info.select === 'string' ? document.querySelector(info.select) : info.select;

              if (!select) {
                throw new Error('Could not find select element');
              }

              if (select.tagName !== 'SELECT') {
                throw new Error('Element isnt of type select');
              }

              return select;
            };

            SlimSelect.prototype.selected = function () {
              if (this.config.isMultiple) {
                var selected = this.data.getSelected();
                var outputSelected = [];

                for (var _i = 0, selected_1 = selected; _i < selected_1.length; _i++) {
                  var s = selected_1[_i];
                  outputSelected.push(s.value);
                }

                return outputSelected;
              } else {
                var selected = this.data.getSelected();
                return selected ? selected.value : '';
              }
            };

            SlimSelect.prototype.set = function (value, type, close, render) {
              if (type === void 0) {
                type = 'value';
              }

              if (close === void 0) {
                close = true;
              }

              if (this.config.isMultiple && !Array.isArray(value)) {
                this.data.addToSelected(value, type);
              } else {
                this.data.setSelected(value, type);
              }

              this.select.setValue();
              this.data.onDataChange();
              this.render();

              if (close) {
                this.close();
              }
            };

            SlimSelect.prototype.setSelected = function (value, type, close, render) {
              if (type === void 0) {
                type = 'value';
              }

              if (close === void 0) {
                close = true;
              }

              if (render === void 0) {
                render = true;
              }

              this.set(value, type, close, render);
            };

            SlimSelect.prototype.setData = function (data) {
              var isValid = data_1.validateData(data);

              if (!isValid) {
                console.error('Validation problem on: #' + this.select.element.id);
                return;
              }

              var newData = JSON.parse(JSON.stringify(data));
              var selected = this.data.getSelected();

              for (var i = 0; i < newData.length; i++) {
                if (!newData[i].value && !newData[i].placeholder) {
                  newData[i].value = newData[i].text;
                }
              }

              if (this.config.isAjax && selected) {
                if (this.config.isMultiple) {
                  var reverseSelected = selected.reverse();

                  for (var _i = 0, reverseSelected_1 = reverseSelected; _i < reverseSelected_1.length; _i++) {
                    var r = reverseSelected_1[_i];
                    newData.unshift(r);
                  }
                } else {
                  newData.unshift(selected);

                  for (var i = 0; i < newData.length; i++) {
                    if (!newData[i].placeholder && newData[i].value === selected.value && newData[i].text === selected.text) {
                      delete newData[i];
                    }
                  }

                  var hasPlaceholder = false;

                  for (var i = 0; i < newData.length; i++) {
                    if (newData[i].placeholder) {
                      hasPlaceholder = true;
                    }
                  }

                  if (!hasPlaceholder) {
                    newData.unshift({
                      text: '',
                      placeholder: true
                    });
                  }
                }
              }

              this.select.create(newData);
              this.data.parseSelectData();
              this.data.setSelectedFromSelect();
            };

            SlimSelect.prototype.addData = function (data) {
              this.addedData.push(data);
              var isValid = data_1.validateData([data]);

              if (!isValid) {
                console.error('Validation problem on: #' + this.select.element.id);
                return;
              }

              this.data.add(this.data.newOption(data));
              this.select.create(this.data.data);
              this.data.parseSelectData();
              this.data.setSelectedFromSelect();
              this.render();
            };

            SlimSelect.prototype.open = function () {
              var _this = this;

              if (!this.config.isEnabled) {
                return;
              }

              if (this.data.contentOpen) {
                return;
              }

              if (this.beforeOpen) {
                this.beforeOpen();
              }

              if (this.config.isMultiple && this.slim.multiSelected) {
                this.slim.multiSelected.plus.classList.add('ss-cross');
              } else if (this.slim.singleSelected) {
                this.slim.singleSelected.arrowIcon.arrow.classList.remove('arrow-down');
                this.slim.singleSelected.arrowIcon.arrow.classList.add('arrow-up');
              }

              this.slim[this.config.isMultiple ? 'multiSelected' : 'singleSelected'].container.classList.add(this.data.contentPosition === 'above' ? this.config.openAbove : this.config.openBelow);

              if (this.config.addToBody) {
                var containerRect = this.slim.container.getBoundingClientRect();
                this.slim.content.style.top = containerRect.top + containerRect.height + window.scrollY + 'px';
                this.slim.content.style.left = containerRect.left + window.scrollX + 'px';
                this.slim.content.style.width = containerRect.width + 'px';
              }

              this.slim.content.classList.add(this.config.open);

              if (this.config.showContent.toLowerCase() === 'up') {
                this.moveContentAbove();
              } else if (this.config.showContent.toLowerCase() === 'down') {
                this.moveContentBelow();
              } else {
                if (helper_1.putContent(this.slim.content, this.data.contentPosition, this.data.contentOpen) === 'above') {
                  this.moveContentAbove();
                } else {
                  this.moveContentBelow();
                }
              }

              if (!this.config.isMultiple) {
                var selected = this.data.getSelected();

                if (selected) {
                  var selectedId = selected.id;
                  var selectedOption = this.slim.list.querySelector('[data-id="' + selectedId + '"]');

                  if (selectedOption) {
                    helper_1.ensureElementInView(this.slim.list, selectedOption);
                  }
                }
              }

              setTimeout(function () {
                _this.data.contentOpen = true;

                if (_this.config.searchFocus) {
                  _this.slim.search.input.focus();
                }

                if (_this.afterOpen) {
                  _this.afterOpen();
                }
              }, this.config.timeoutDelay);
            };

            SlimSelect.prototype.close = function () {
              var _this = this;

              if (!this.data.contentOpen) {
                return;
              }

              if (this.beforeClose) {
                this.beforeClose();
              }

              if (this.config.isMultiple && this.slim.multiSelected) {
                this.slim.multiSelected.container.classList.remove(this.config.openAbove);
                this.slim.multiSelected.container.classList.remove(this.config.openBelow);
                this.slim.multiSelected.plus.classList.remove('ss-cross');
              } else if (this.slim.singleSelected) {
                this.slim.singleSelected.container.classList.remove(this.config.openAbove);
                this.slim.singleSelected.container.classList.remove(this.config.openBelow);
                this.slim.singleSelected.arrowIcon.arrow.classList.add('arrow-down');
                this.slim.singleSelected.arrowIcon.arrow.classList.remove('arrow-up');
              }

              this.slim.content.classList.remove(this.config.open);
              this.data.contentOpen = false;
              this.search('');
              setTimeout(function () {
                _this.slim.content.removeAttribute('style');

                _this.data.contentPosition = 'below';

                if (_this.config.isMultiple && _this.slim.multiSelected) {
                  _this.slim.multiSelected.container.classList.remove(_this.config.openAbove);

                  _this.slim.multiSelected.container.classList.remove(_this.config.openBelow);
                } else if (_this.slim.singleSelected) {
                  _this.slim.singleSelected.container.classList.remove(_this.config.openAbove);

                  _this.slim.singleSelected.container.classList.remove(_this.config.openBelow);
                }

                _this.slim.search.input.blur();

                if (_this.afterClose) {
                  _this.afterClose();
                }
              }, this.config.timeoutDelay);
            };

            SlimSelect.prototype.moveContentAbove = function () {
              var selectHeight = 0;

              if (this.config.isMultiple && this.slim.multiSelected) {
                selectHeight = this.slim.multiSelected.container.offsetHeight;
              } else if (this.slim.singleSelected) {
                selectHeight = this.slim.singleSelected.container.offsetHeight;
              }

              var contentHeight = this.slim.content.offsetHeight;
              var height = selectHeight + contentHeight - 1;
              this.slim.content.style.margin = '-' + height + 'px 0 0 0';
              this.slim.content.style.height = height - selectHeight + 1 + 'px';
              this.slim.content.style.transformOrigin = 'center bottom';
              this.data.contentPosition = 'above';

              if (this.config.isMultiple && this.slim.multiSelected) {
                this.slim.multiSelected.container.classList.remove(this.config.openBelow);
                this.slim.multiSelected.container.classList.add(this.config.openAbove);
              } else if (this.slim.singleSelected) {
                this.slim.singleSelected.container.classList.remove(this.config.openBelow);
                this.slim.singleSelected.container.classList.add(this.config.openAbove);
              }
            };

            SlimSelect.prototype.moveContentBelow = function () {
              this.data.contentPosition = 'below';

              if (this.config.isMultiple && this.slim.multiSelected) {
                this.slim.multiSelected.container.classList.remove(this.config.openAbove);
                this.slim.multiSelected.container.classList.add(this.config.openBelow);
              } else if (this.slim.singleSelected) {
                this.slim.singleSelected.container.classList.remove(this.config.openAbove);
                this.slim.singleSelected.container.classList.add(this.config.openBelow);
              }
            };

            SlimSelect.prototype.enable = function () {
              this.config.isEnabled = true;

              if (this.config.isMultiple && this.slim.multiSelected) {
                this.slim.multiSelected.container.classList.remove(this.config.disabled);
              } else if (this.slim.singleSelected) {
                this.slim.singleSelected.container.classList.remove(this.config.disabled);
              }

              this.select.triggerMutationObserver = false;
              this.select.element.disabled = false;
              this.slim.search.input.disabled = false;
              this.select.triggerMutationObserver = true;
            };

            SlimSelect.prototype.disable = function () {
              this.config.isEnabled = false;

              if (this.config.isMultiple && this.slim.multiSelected) {
                this.slim.multiSelected.container.classList.add(this.config.disabled);
              } else if (this.slim.singleSelected) {







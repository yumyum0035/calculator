
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
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
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
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
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
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
        flushing = false;
        seen_callbacks.clear();
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
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
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
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
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
            this.$destroy = noop;
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
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
        attr(node, attribute, value);
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

    /* src/App.svelte generated by Svelte v3.38.2 */

    const { console: console_1 } = globals;
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let div0;
    	let p;
    	let t0;
    	let t1;
    	let div1;
    	let button0;
    	let t3;
    	let button1;
    	let t5;
    	let button2;
    	let t7;
    	let button3;
    	let t9;
    	let button4;
    	let t11;
    	let button5;
    	let t13;
    	let button6;
    	let t15;
    	let button7;
    	let t17;
    	let button8;
    	let t19;
    	let button9;
    	let t21;
    	let button10;
    	let t23;
    	let button11;
    	let t25;
    	let button12;
    	let t27;
    	let button13;
    	let t29;
    	let button14;
    	let t31;
    	let button15;
    	let t33;
    	let button16;
    	let t35;
    	let button17;
    	let t37;
    	let button18;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div0 = element("div");
    			p = element("p");
    			t0 = text(/*data*/ ctx[0]);
    			t1 = space();
    			div1 = element("div");
    			button0 = element("button");
    			button0.textContent = "AC";
    			t3 = space();
    			button1 = element("button");
    			button1.textContent = "+/-";
    			t5 = space();
    			button2 = element("button");
    			button2.textContent = "%";
    			t7 = space();
    			button3 = element("button");
    			button3.textContent = "÷";
    			t9 = space();
    			button4 = element("button");
    			button4.textContent = "7";
    			t11 = space();
    			button5 = element("button");
    			button5.textContent = "8";
    			t13 = space();
    			button6 = element("button");
    			button6.textContent = "9";
    			t15 = space();
    			button7 = element("button");
    			button7.textContent = "×";
    			t17 = space();
    			button8 = element("button");
    			button8.textContent = "4";
    			t19 = space();
    			button9 = element("button");
    			button9.textContent = "5";
    			t21 = space();
    			button10 = element("button");
    			button10.textContent = "6";
    			t23 = space();
    			button11 = element("button");
    			button11.textContent = "−";
    			t25 = space();
    			button12 = element("button");
    			button12.textContent = "1";
    			t27 = space();
    			button13 = element("button");
    			button13.textContent = "2";
    			t29 = space();
    			button14 = element("button");
    			button14.textContent = "3";
    			t31 = space();
    			button15 = element("button");
    			button15.textContent = "+";
    			t33 = space();
    			button16 = element("button");
    			button16.textContent = "0";
    			t35 = space();
    			button17 = element("button");
    			button17.textContent = ",";
    			t37 = space();
    			button18 = element("button");
    			button18.textContent = "=";
    			add_location(p, file, 66, 2, 1429);
    			attr_dev(div0, "class", "resultats");
    			add_location(div0, file, 65, 1, 1403);
    			attr_dev(button0, "id", "clear");
    			attr_dev(button0, "class", "lightGray");
    			add_location(button0, file, 71, 2, 1504);
    			attr_dev(button1, "id", "posinegative");
    			attr_dev(button1, "class", "lightGray");
    			add_location(button1, file, 72, 2, 1606);
    			attr_dev(button2, "id", "percent");
    			attr_dev(button2, "class", "lightGray");
    			add_location(button2, file, 73, 2, 1723);
    			attr_dev(button3, "id", "divide");
    			attr_dev(button3, "class", "orange");
    			add_location(button3, file, 74, 2, 1828);
    			attr_dev(button4, "id", "num7");
    			add_location(button4, file, 75, 2, 1920);
    			attr_dev(button5, "id", "num8");
    			add_location(button5, file, 76, 2, 1983);
    			attr_dev(button6, "id", "num9");
    			add_location(button6, file, 77, 2, 2046);
    			attr_dev(button7, "id", "multiply");
    			attr_dev(button7, "class", "orange");
    			add_location(button7, file, 78, 2, 2109);
    			attr_dev(button8, "id", "num4");
    			add_location(button8, file, 79, 2, 2206);
    			attr_dev(button9, "id", "num5");
    			add_location(button9, file, 80, 2, 2269);
    			attr_dev(button10, "id", "num6");
    			add_location(button10, file, 81, 2, 2332);
    			attr_dev(button11, "id", "less");
    			attr_dev(button11, "class", "orange");
    			add_location(button11, file, 82, 2, 2395);
    			attr_dev(button12, "id", "num1");
    			add_location(button12, file, 83, 2, 2487);
    			attr_dev(button13, "id", "num2");
    			add_location(button13, file, 84, 2, 2550);
    			attr_dev(button14, "id", "num3");
    			add_location(button14, file, 85, 2, 2613);
    			attr_dev(button15, "id", "plus");
    			attr_dev(button15, "class", "orange");
    			add_location(button15, file, 86, 2, 2676);
    			attr_dev(button16, "id", "num0");
    			attr_dev(button16, "class", "zero");
    			add_location(button16, file, 87, 2, 2763);
    			attr_dev(button17, "id", "decimal");
    			add_location(button17, file, 88, 2, 2839);
    			attr_dev(button18, "id", "equal");
    			attr_dev(button18, "class", "orange");
    			add_location(button18, file, 89, 2, 2907);
    			attr_dev(div1, "class", "calculator__keys");
    			add_location(div1, file, 70, 1, 1471);
    			attr_dev(main, "class", "calculator");
    			add_location(main, file, 63, 0, 1357);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div0);
    			append_dev(div0, p);
    			append_dev(p, t0);
    			append_dev(main, t1);
    			append_dev(main, div1);
    			append_dev(div1, button0);
    			append_dev(div1, t3);
    			append_dev(div1, button1);
    			append_dev(div1, t5);
    			append_dev(div1, button2);
    			append_dev(div1, t7);
    			append_dev(div1, button3);
    			append_dev(div1, t9);
    			append_dev(div1, button4);
    			append_dev(div1, t11);
    			append_dev(div1, button5);
    			append_dev(div1, t13);
    			append_dev(div1, button6);
    			append_dev(div1, t15);
    			append_dev(div1, button7);
    			append_dev(div1, t17);
    			append_dev(div1, button8);
    			append_dev(div1, t19);
    			append_dev(div1, button9);
    			append_dev(div1, t21);
    			append_dev(div1, button10);
    			append_dev(div1, t23);
    			append_dev(div1, button11);
    			append_dev(div1, t25);
    			append_dev(div1, button12);
    			append_dev(div1, t27);
    			append_dev(div1, button13);
    			append_dev(div1, t29);
    			append_dev(div1, button14);
    			append_dev(div1, t31);
    			append_dev(div1, button15);
    			append_dev(div1, t33);
    			append_dev(div1, button16);
    			append_dev(div1, t35);
    			append_dev(div1, button17);
    			append_dev(div1, t37);
    			append_dev(div1, button18);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[4], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[5], false, false, false),
    					listen_dev(button2, "click", /*click_handler_2*/ ctx[6], false, false, false),
    					listen_dev(button3, "click", /*click_handler_3*/ ctx[7], false, false, false),
    					listen_dev(button4, "click", /*click_handler_4*/ ctx[8], false, false, false),
    					listen_dev(button5, "click", /*click_handler_5*/ ctx[9], false, false, false),
    					listen_dev(button6, "click", /*click_handler_6*/ ctx[10], false, false, false),
    					listen_dev(button7, "click", /*click_handler_7*/ ctx[11], false, false, false),
    					listen_dev(button8, "click", /*click_handler_8*/ ctx[12], false, false, false),
    					listen_dev(button9, "click", /*click_handler_9*/ ctx[13], false, false, false),
    					listen_dev(button10, "click", /*click_handler_10*/ ctx[14], false, false, false),
    					listen_dev(button11, "click", /*click_handler_11*/ ctx[15], false, false, false),
    					listen_dev(button12, "click", /*click_handler_12*/ ctx[16], false, false, false),
    					listen_dev(button13, "click", /*click_handler_13*/ ctx[17], false, false, false),
    					listen_dev(button14, "click", /*click_handler_14*/ ctx[18], false, false, false),
    					listen_dev(button15, "click", /*click_handler_15*/ ctx[19], false, false, false),
    					listen_dev(button16, "click", /*click_handler_16*/ ctx[20], false, false, false),
    					listen_dev(button17, "click", /*click_handler_17*/ ctx[21], false, false, false),
    					listen_dev(button18, "click", /*calc*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*data*/ 1) set_data_dev(t0, /*data*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let currentNum = [];
    	let data = "0"; //variable que muestra datos por pantalla
    	let paramA; //primera variable que añadimos y tambien el resultado final
    	let paramB; //variable 2

    	function getNumber(num) {
    		currentNum.push(num);
    		$$invalidate(0, data = currentNum.toString().replace(/,/g, ""));

    		if (operator == undefined) {
    			paramA = data.split(" ");
    			paramA = parseFloat(paramA);
    		} else {
    			paramB = parseFloat(data);
    		}
    	}

    	let operator;

    	function chooseOperator(typeOf) {
    		currentNum = [];
    		return operator = typeOf;
    	}

    	function calc() {
    		switch (operator) {
    			case "add":
    				paramA = paramA + paramB;
    				return $$invalidate(0, data = paramA.toString());
    			case "subtract":
    				paramA = paramA - paramB;
    				return $$invalidate(0, data = paramA.toString());
    			case "multiply":
    				paramA = paramA * paramB;
    				return $$invalidate(0, data = paramA.toString());
    			case "divide":
    				if (paramB !== 0) {
    					paramA = paramA / paramB;
    					return $$invalidate(0, data = paramA.toString());
    				} else {
    					paramA = undefined;
    					return $$invalidate(0, data = "Error");
    				}
    			case "percent":
    				paramA = paramA / 100;
    				return $$invalidate(0, data = paramA.toString());
    			case "posinegative":
    				paramA = paramA * -1;
    				return $$invalidate(0, data = paramA.toString());
    			case "clear":
    				currentNum = [];
    				console.log(data);
    				operator = undefined;
    				paramA = undefined;
    				return $$invalidate(0, data = "0");
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		chooseOperator("clear");
    		calc();
    	};

    	const click_handler_1 = () => {
    		chooseOperator("posinegative");
    		calc();
    	};

    	const click_handler_2 = () => {
    		chooseOperator("percent");
    		calc();
    	};

    	const click_handler_3 = () => {
    		chooseOperator("divide");
    	};

    	const click_handler_4 = () => {
    		getNumber(7);
    	};

    	const click_handler_5 = () => {
    		getNumber(8);
    	};

    	const click_handler_6 = () => {
    		getNumber(9);
    	};

    	const click_handler_7 = () => {
    		chooseOperator("multiply");
    	};

    	const click_handler_8 = () => {
    		getNumber(4);
    	};

    	const click_handler_9 = () => {
    		getNumber(5);
    	};

    	const click_handler_10 = () => {
    		getNumber(6);
    	};

    	const click_handler_11 = () => {
    		chooseOperator("subtract");
    	};

    	const click_handler_12 = () => {
    		getNumber(1);
    	};

    	const click_handler_13 = () => {
    		getNumber(2);
    	};

    	const click_handler_14 = () => {
    		getNumber(3);
    	};

    	const click_handler_15 = () => {
    		chooseOperator("add");
    	};

    	const click_handler_16 = () => {
    		getNumber(0);
    	};

    	const click_handler_17 = () => {
    		getNumber(".");
    	};

    	$$self.$capture_state = () => ({
    		currentNum,
    		data,
    		paramA,
    		paramB,
    		getNumber,
    		operator,
    		chooseOperator,
    		calc
    	});

    	$$self.$inject_state = $$props => {
    		if ("currentNum" in $$props) currentNum = $$props.currentNum;
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("paramA" in $$props) paramA = $$props.paramA;
    		if ("paramB" in $$props) paramB = $$props.paramB;
    		if ("operator" in $$props) operator = $$props.operator;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		data,
    		getNumber,
    		chooseOperator,
    		calc,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6,
    		click_handler_7,
    		click_handler_8,
    		click_handler_9,
    		click_handler_10,
    		click_handler_11,
    		click_handler_12,
    		click_handler_13,
    		click_handler_14,
    		click_handler_15,
    		click_handler_16,
    		click_handler_17
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map

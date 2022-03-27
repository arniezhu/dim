/*! 
 * DIM - Draggable Image Mask
 * @link https://github.com/arniezhu/dim
 * @version 1.0.1
 * @copyright (c) 2022-present arnie.info All Rights Reserved. 
 */

function DIM (elemId, options) {
    options = options || {};

    this.container = document.getElementById(elemId);
    this.code = '';
    this.range = {};

    // initial parameters
    this.options = options;
    this.options.direction = options.direction || 'right';
    this.options.padding = parseFloat(options.padding) || 0;
    this.options.angle = parseFloat(options.angle) || 0;

    // shadow
    var shadow = options.shadow || {};
    this.options.shadow = shadow;
    this.options.shadow.size = parseFloat(shadow.size) || 64;
    this.options.shadow.opacity = parseFloat(shadow.opacity) || 0.5;
    this.options.shadow.color = shadow.color || '#ffcc00';
    this.options.shadow.style = shadow.style || 'light';

    // controller 
    var controller = options.controller || {};
    this.options.controller = controller;
    this.options.controller.width = parseFloat(controller.width) || 48;
    this.options.controller.height = parseFloat(controller.height) || 48;
    this.options.controller.color = controller.color || '#ffcc00';

	/* Browser vendor prefix */
	var vendor = (function(){
		var doc_style = document.documentElement.style, engine;

		if ('WebkitAppearance' in doc_style) {
			engine = 'webkit';
		} else if ('MozAppearance' in doc_style) {
			engine = 'gecko';
		} else if (typeof navigator.cpuClass === 'string') {
			engine = 'trident';
		} else if (navigator.userAgent.indexOf('Opera') > -1) {
			engine = 'presto';
		}

		return {webkit:'Webkit', gecko:'Moz', trident:'ms', presto:'O'}[engine];
	})();

    this.vendor = vendor;
    this.callback = function(){};

    if (! this.options.width) this.options.width = this.container.clientWidth;

    this.init();
}

/**
 *  Render an element with transform-style
 */
DIM.prototype.render = function (elem, left, top) {	
    if (! elem) return;

    left = left || 0;
    top  = top  || 0;

    var helper_elem = document.createElement('div'),
        perspective_property = this.vendor + 'Perspective',
        transform = this.vendor + 'Transform';

    if (helper_elem.style[perspective_property] !== undefined) {	
        elem.style[transform] = 'translate3d('+left+'px,'+top+'px,0)';
    } else {
        elem.style[transform] = 'translate('+left+'px,'+top+'px)';
    }
}

/**
 * Initialize
 */
DIM.prototype.init = function() {
    this.container.innerHTML = '';
    this.code = Math.random().toString(36).slice(-8);
    this.is_loaded = false;

    // DIM inner
    var box = document.createElement('div');
    box.className = 'dim-inner';
    box.setAttribute('id', 'dim-inner-'+this.code);
    box.setAttribute('style', 'position:relative; overflow: hidden');
    box.style.boxSizing = 'border-box';
    box.style.padding = this.options.padding+'px';
    box.style.width = this.options.width+'px';

    this.container.appendChild(box);

    // background
    var image = new Image(),
        background = document.createElement('div'),
        bg_width = this.options.width-this.options.padding*2;
    image.src = this.options.background;
    background.className = 'dim-background';

    background.setAttribute('style', 'display:block; margin:0; padding: 0');
    background.style.backgroundImage = 'url('+this.options.background+')';
    background.style.backgroundRepeat = 'no-repeat';
    background.style.backgroundSize = '100% 100%';
    background.style.width = bg_width+'px';

    var that = this;

    var initialize = function() {
        box.appendChild(background);
        that.setRange();
        that.createMask();
        that.createController();
        that.showEffect(0,0);
        that.registerEvents();

        var mask = new Image();
        mask.src = that.options.mask;
        mask.onload = function(){
            typeof that.callback === 'function' && that.callback();
            that.is_loaded = true;
        }
    };

    if (this.options.height) {
        var bg_height = this.options.height - this.options.padding*2;
        background.style.height = bg_height+'px';
        box.style.height = this.options.height +'px';
        image.onload = initialize;
    } else {
        image.onload = function(){
            var ratio =  bg_width / this.width,
                height = this.height*ratio + that.options.padding*2;
            that.options.height = height;
            box.style.height = height +'px';
            background.style.height = this.height*ratio + 'px';
            initialize();
        }
    }
}

/**
 * Set range
 */
DIM.prototype.setRange = function() {
    var direction = this.options.direction,
        angle = Math.abs(this.options.angle) % 360,
        width = this.options.width - this.options.padding*2,
        height = this.options.height - this.options.padding*2;

    if (angle > 180) angle = 360 - angle;

    var is_hor = direction!=='up' && direction!=='down' ? true : false,
        num = direction!=='left' && direction!=='up' ? 0 : 100;

    if (is_hor) {
        var max = this.options.width,
            radian1 = Math.abs(angle-90) * Math.PI / 180,
            radian2 = angle * Math.PI / 180;
    } else {
        if (angle <= 90) {
            var max = this.options.height,
                radian1 = radian2 = angle * Math.PI / 180;
        } else {
            var max = this.options.height,
                radian1 = (180-angle) * Math.PI / 180,
                radian2 = angle * Math.PI / 180;
        }
    }

    var gradient_length = Math.sin(radian1)*width + Math.cos(radian1)*height,
        track_length = gradient_length / Math.cos(radian2);
 
    this.range = {
        is_horizontal: is_hor,
        position: num/100 * max,
        last_position: 0,
        gradient_length: gradient_length,
        track_length: track_length,
        min: 0,
        max: max,
    };
}

/**
 * Create mask layer
 */
DIM.prototype.createMask = function() {
    var parent_elem = document.getElementById('dim-inner-'+this.code);

    // mask
    var mask = document.createElement('div'),
        mask_width = this.options.width - this.options.padding*2,
        mask_height = this.options.height - this.options.padding*2;

    mask.className = 'dim-mask';
    mask.setAttribute('id', 'dim-mask-'+this.code);

    mask.style.position = 'absolute';
    mask.style.left = this.options.padding+'px';
    mask.style.top = this.options.padding+'px';
    mask.style.width = mask_width+'px';
    mask.style.height = mask_height+'px';
    mask.style.backgroundImage = 'url('+this.options.mask+')';
    mask.style.backgroundRepeat = 'no-repeat';
    mask.style.backgroundSize = '100% 100%';

    parent_elem.appendChild(mask);
}

/**
 * Create controller
 */
DIM.prototype.createController = function() {
    var parent_elem = document.getElementById('dim-inner-'+this.code),
        is_hor = this.range.is_horizontal;

    // controller box
    var box = document.createElement('div');
    box.className = 'dim-controller-box';
    box.setAttribute('id', 'dim-controller-box-'+this.code);

    var left = is_hor ? '0' : '50%',
        top = is_hor ? '50%' : '0';
    box.setAttribute('style', 'position: absolute; left:'+left+'; top:'+top );
    parent_elem.appendChild(box);

    // shadow
    this.generateShadow();

    // controller
    var controller = document.createElement('div');
    controller.className = 'dim-controller';
    controller.setAttribute('id', 'dim-controller-'+this.code);

    controller.style.position = 'absolute';
    controller.style.width = this.options.controller.width;
    controller.style.height = this.options.controller.height;
    controller.style.cursor = 'move';

    box.appendChild(controller);

    if (! this.options.controller.icon) {
        var angle = is_hor ? 0 : 90,
            transform = 'translate(-50%,-50%) rotate('+angle+'deg)'; 
        controller.style[this.vendor+'Transform'] = transform;

        this.generateIcon();
    } else {
        var icon = document.createElement('img');
        icon.src = this.options.controller.icon;
        icon.width = this.options.controller.width;
        icon.height = this.options.controller.height;

        var angle = 0 - this.options.angle,
            transform = 'translate(-50%,-50%) rotate('+angle+'deg)'; 
        controller.style[this.vendor+'Transform'] = transform;

        controller.appendChild(icon);
    } 
}

/**
 * Generate shadow
 */
DIM.prototype.generateShadow = function () {
    var box = document.getElementById('dim-controller-box-'+this.code);
        shadow = document.createElement('div'),
        direction = this.options.direction,
        color1 = this.options.shadow.color,
        color2 = this.options.shadow.style!='dark' 
                 ? 'rgba(255,255,255,0)' : 'rgba(0,0,0,0)';

    shadow.className = 'dim-shadow';
    shadow.setAttribute('style', 'position: absolute; left: 50%; top: 50%');
    shadow.style.opacity = this.options.shadow.opacity;

    // shadow's style
    if (direction==='right' || direction==='left') {
        shadow.style.width = this.options.shadow.size +'px';
        shadow.style.height = this.options.height*10 +'px';
        shadow.style.marginTop = -this.options.height*5 +'px';
        if (direction === 'right') {
            var transform_origin = 'right center',
                background = 'linear-gradient(90deg,'+color2+','+color1+')';
            shadow.style.marginLeft = - this.options.shadow.size +'px';
        } else {    
            var transform_origin = 'left center',
                background = 'linear-gradient(90deg,'+color1+','+color2+')';
        }
    } else {
        shadow.style.width = this.options.width*10 +'px';
        shadow.style.height = this.options.shadow.size +'px';
        shadow.style.marginLeft = -this.options.width*5 +'px';
        if (direction !== 'up') {
            var transform_origin = 'center bottom',
                background = 'linear-gradient(0deg,'+color1+','+color2+')';
            shadow.style.marginTop = - this.options.shadow.size +'px';
        } else {
            var transform_origin = 'center top',
                background = 'linear-gradient(0deg,'+color2+','+color1+')';
        }
    }
    shadow.style[this.vendor+'Transform'] = 'rotate('+this.options.angle+'deg)';
    shadow.style[this.vendor+'TransformOrigin'] = transform_origin;

    shadow.style.backgroundImage = background;

    box.appendChild(shadow);
}

/**
 * Generate controller icon
 */
DIM.prototype.generateIcon = function () {
    var box = document.getElementById('dim-controller-'+this.code),
        svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

    // circle
    var circ = document.createElementNS('http://www.w3.org/2000/svg','circle');

    circ.setAttribute('cx', 16);
    circ.setAttribute('cy', 16);
    circ.setAttribute('r', 16);
    circ.setAttribute('fill', this.options.controller.color);
        
    // left arrow
    var larr = document.createElementNS('http://www.w3.org/2000/svg','polygon'),
        larr_points = '14,12 13,11 8,16 13,21 14,20 10,16';

    larr.setAttribute('points', larr_points);
    larr.setAttribute('fill', '#333');

    // right arrow
    var rarr = document.createElementNS('http://www.w3.org/2000/svg','polygon'),
        rarr_points = '18,12 19,11 24,16 19,21 18,20 22,16';

    rarr.setAttribute('points', rarr_points);
    rarr.setAttribute('fill', '#333');

    // compose shapes
    svg.appendChild(circ);
    svg.appendChild(larr);
    svg.appendChild(rarr);

    svg.setAttribute('width', this.options.controller.width);
    svg.setAttribute('height', this.options.controller.height);
    svg.setAttribute('viewBox', '0 0 32 32');

    box.appendChild(svg);
}

/**
 * Register events
 */
DIM.prototype.registerEvents = function() {
    if (/AppleWebKit.*Mobile.*/.test(navigator.userAgent)) {
        this.listenTouchEvents();
    } else {
        this.listenMouseEvents();
    }
}

/**
 * Listen touch events
 */
DIM.prototype.listenTouchEvents = function() {
    var controller = document.getElementById('dim-controller-'+this.code),
        that = this, x, y;

    // touch start
    controller.addEventListener('touchstart', function(e){
        x = e.touches[0].clientX;
        y = e.touches[0].clientY;
    });			
    // touch move
    controller.addEventListener('touchmove', function(e){
        e.preventDefault();
        var _x = e.changedTouches[0].clientX - x,
            _y = e.changedTouches[0].clientY - y;
        that.showEffect(_x, _y);
    });
    // touch end
    controller.addEventListener('touchend', function(){
        that.range.position = that.range.last_position;
    });
}

/**
 * Listen mouse events
 */
DIM.prototype.listenMouseEvents = function() {
    var controller = document.getElementById('dim-controller-'+this.code),
        that = this;

    // mouse down
    controller.onmousedown = function(e){
        e.preventDefault();
        e.stopPropagation();

        var handle = function(e) {
            e.preventDefault();
            e.stopPropagation();
        };
        if (/WebKit/i.test(navigator.userAgent))
            document.addEventListener('mousedown', handle, false);

        var x = e.clientX,
            y = e.clientY;

        // mouse move 
        document.onmousemove = function(e){
            that.showEffect(e.clientX - x, e.clientY - y);
            return false;
        };

        // mouse up 
        document.onmouseup = function(){
            document.onmousemove = null;
            that.range.position = that.range.last_position;

            if (/WebKit/i.test(navigator.userAgent))
                document.removeEventListener('mousedown', handle, false);
        };
    };	
}

/**
 * Show the effect
 */
DIM.prototype.showEffect = function(x, y) {
    var mask = document.getElementById('dim-mask-'+this.code),
        _box = document.getElementById('dim-controller-box-'+this.code),
        direction = this.options.direction;

    var gradient_length = this.range.gradient_length,
        track_length = this.range.track_length,
        padding = this.options.padding,
        active_length = this.range.is_horizontal
            ? this.options.width - padding*2
            : this.options.height - padding*2;

    // controller-box position
    var position = this.range.is_horizontal 
            ? this.range.position+x
            : this.range.position+y;
    if (position < this.range.min) position = this.range.min;
    if (position > this.range.max) position = this.range.max;

    if (this.range.is_horizontal) {
        this.render(_box, position, 0);
        var angle = this.options.angle - 90;
    } else {
        this.render(_box, 0, position);
        var angle = this.options.angle;
    }

    var overflow = (track_length-active_length),
        cos = Math.cos(this.options.angle * Math.PI/180),
        splice = gradient_length - (position-padding+overflow/2) * cos,
        gradient = direction!=='left' && direction!=='up'
            ? 'transparent,transparent '+splice+'px,black '+splice+'px,black'
            : 'black,black '+splice+'px,transparent '+splice+'px,transparent',
        mask_image = 'linear-gradient('+angle+'deg,'+gradient+')';

    if (mask) mask.style[this.vendor+'MaskImage'] = mask_image;

    this.range.last_position = position;
}

/**
 * Preview
 */
DIM.prototype.preview = function (a, b) {
    var params = typeof arguments[0] === 'object' ? arguments[0] : {},
        duration = Math.abs( parseInt(arguments[1]) ) || 1000;

    if (!arguments[1] && typeof arguments[0]==='number') 
        duration = Math.abs( parseInt(arguments[0]) );

    var start = parseFloat(params.start) || 0,
        end = parseFloat(params.end) || 100,
        length = end - start,
        u_turn = params.u_turn ? true : false,
        that = this;

    if (start < 0) start = 0;
    if (start > 100) start = 100;
    if (end < 0) end = 0;
    if (end > 100) end = 100;

    if (end < start && !u_turn) length = start - end;
    else if (end <= start && u_turn) length = (100-start) * 2 + (start - end);
    else if (end >= start && u_turn) length = (100-end) * 2 + (end - start);

    var animation = function() {
        var active_length = that.range.max,
            direction = that.options.direction,
            speed = length/100 * active_length / duration * 5,
            is_back = false,
            current_px = 0,
            finish_px = (direction === 'right' || direction === 'down')
                ? (end-start)/100 * active_length
                : (start-end)/100 * active_length;

        that.range.position = (direction === 'right' || direction === 'down')
            ? start/100 * active_length 
            : (100-start)/100 * active_length; 

        var finish = function() {
            current_px = finish_px;
            that.showEffect(current_px, current_px);
            that.range.position = that.range.last_position;
            clearInterval(timer);
        };
        
        var timer = setInterval(function(){
            that.showEffect(current_px, current_px);

            if (direction === 'right' || direction === 'down') {
                current_px += (!is_back && !(start>end && !u_turn)) 
                    ? speed : -speed;
                var back_px = active_length - start/100*active_length;

                if (!u_turn && start<=end && current_px>=finish_px
                  || !u_turn && start>end && current_px<=finish_px
                  || u_turn && is_back && current_px <= finish_px) 
                {
                    finish();
                } else if (u_turn && !is_back && current_px >= back_px) {
                    current_px = back_px;
                    is_back = true;
                }
            } else {
                current_px += (!is_back && !(start>end && !u_turn)) 
                    ? -speed : speed; 
                var back_px = 0 - (100-start)/100*active_length;

                if (!u_turn && start<=end && current_px<=finish_px
                  || !u_turn && start>end && current_px>=finish_px
                  || u_turn && is_back && current_px >= finish_px)
                {
                    finish();
                } else if (u_turn && !is_back && current_px <= back_px) {
                    current_px = back_px;
                    is_back = true;
                }
            }
        },5);
    };

    this.is_loaded ? animation() : this.callback = animation;
}

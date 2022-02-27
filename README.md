# DIM - Draggable Image Mask

DIM is a simple script for creating draggable image mask on the webpage.


## How to use

```js
var dim = new DIM(
        'elementID',                    // Element ID name
    {
        background: 'image source',     // Background image
                                        // * This value is required
        image: 'image source',          // Mask image
                                        // * This value is required
        direction: 'right',             // Direction: 'right','down','left','up'
                                        // Assuming 'right' if not provided
        padding: 0,                     // Container padding
                                        // Assuming 0 if not provided
        angle: 0,                       // Angle
                                        // Assuming 0 if not provided
        shadow: {
            size: 64,                   // Assuming 64 if not provided
            color: '#ffcc00',           // Assuming '#ffcc00' if not provided
            opacity: 0.5,               // Assuming 0.5 if not provided
        },
        controller: {
            width: 48,                  // Assuming 48 if not provided
            height: 48,                 // Assuming 48 if not provided
            color: '#ffcc00',           // Assuming '#ffcc00' if not provided
            icon: null,                 // If not provided, create an svg icon
        },
    });
dim.preview({
    start: 0,                           // start of the control track
    end: 100,                           // end of the control track
    u_turn: true,                       // take a u-turn
}, 1000);                               // duration: 1000ms

```

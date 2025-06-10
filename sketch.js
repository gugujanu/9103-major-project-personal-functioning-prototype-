/**
 * Global Arrays: These arrays hold the main components of our artwork,
 * allowing us to manage and update them collectively.
 */
let wheels = []; // Stores all Wheel objects, representing the main circular elements.
let connectors = []; // Stores all Connector objects, which link the wheels.
let dandelionParticles = []; // Stores particles that "blow away" from wheels, creating a dynamic effect.
let blownAwayHistory = []; // Tracks the state of wheels that have been "blown away" for undo functionality.

/**
 * Color Palettes: Inspired by Pacita Abad's "Wheels of Fortune," these palettes
 * define the vibrant and layered color schemes for each wheel. Each sub-array
 * contains colors for different parts of a wheel (Base, Outer Dots, Inner Dots, Spokes, Center).
 * These are approximations and can be fine-tuned for precise matching.
 */
const colorPalettes = [
  // Palette 1: Deep Blue/Purple with Yellow/Orange Accents, evoking a rich, contrasting feel.
  ['#45206A', '#FFD700', '#FF8C00', '#B0E0E6', '#8A2BE2'], // Base, Outer Dots, Inner Dots, Spokes, Center
  // Palette 2: Fiery Reds and Oranges with Green/Blue contrast, creating a dynamic and energetic visual.
  ['#D90429', '#F4D35E', '#F7B267', '#0A796F', '#2E4057'],
  // Palette 3: Warm Earthy Tones with Bright Pinks/Greens, offering a softer yet vibrant combination.
  ['#A34A2A', '#F2AF29', '#E0A890', '#3E8914', '#D4327C'],
  // Palette 4: Cool Blues and Greens with Yellow/Pink Pop, providing a refreshing and lively contrast.
  ['#004C6D', '#7FC2BF', '#FFC94F', '#D83A56', '#5C88BF'],
  // Palette 5: Vibrant Pinks and Purples with Yellow/Green, for a playful and bright aesthetic.
  ['#C11F68', '#F9E795', '#F5EEF8', '#2ECC71', '#8E44AD'],
  // Palette 6: Deep Teal with Orange/Red, offering a sophisticated and warm contrast.
  ['#006D77', '#FF8C00', '#E29578', '#83C5BE', '#D64045'],
  // Additional palettes can be added here following analysis of the original artwork.
];

/**
 * Background Color: A dark, muted background color chosen to resemble the
 * original painting's aesthetic, providing a subtle contrast to the vibrant wheels.
 */
const backgroundColor = '#2A363B';

/**
 * Setup Function: Initializes the canvas and sets up the initial state of the artwork.
 * This function runs once at the beginning of the program.
 */
function setup() {
  createCanvas(windowWidth, windowHeight); // Create a canvas that fills the browser window.
  angleMode(RADIANS); // Set angle mode to RADIANS for consistent trigonometric calculations.

  initializeArtwork(); // Call the function to populate the artwork with wheels and connectors.
}

/**
 * Draw Function: This function is continuously called by p5.js, typically 60 times per second.
 * It's responsible for rendering all elements and updating their states for animation.
 */
function draw() {
  background(backgroundColor); // Clear the canvas with the defined background color in each frame.

  /**
   * Display Connectors: Connectors are drawn first to ensure they appear
   * behind the wheels, creating a layered visual effect.
   */
  for (const conn of connectors) {
    conn.display(); // Call the display method for each connector object.
  }

  /**
   * Display Wheels: Each wheel is drawn and its fading-in animation is updated.
   * Wheels are drawn on top of the connectors.
   */
  for (const wheel of wheels) {
    wheel.display(); // Call the display method for each wheel object.
    wheel.updateAlpha(); // Update the alpha (transparency) value for fade-in effect.
  }

  /**
   * Update and Display Dandelion Particles: Iterates through particles in reverse
   * to safely remove faded particles without affecting the loop index.
   */
  for (let i = dandelionParticles.length - 1; i >= 0; i--) {
    let p = dandelionParticles[i];
    p.update(); // Update particle's position, alpha, and size.
    p.display(); // Draw the particle on the canvas.

    // Remove particles that have completely faded out AND are not in a returning state.
    if (p.alpha <= 0 && !p.isReturning) {
      dandelionParticles.splice(i, 1); // Remove the particle from the array.
    }
    // Remove returning particles that have reached their target and faded out.
    if (p.isReturning && dist(p.x, p.y, p.targetX, p.targetY) < 1 && p.alpha <= 0) {
      dandelionParticles.splice(i, 1); // Remove the returning particle from the array.
    }
  }
}

/**
 * --- Initialization Function ---
 * Initializes or re-initializes all artwork elements: wheels, connectors, and particles.
 * This is called on setup and whenever the window is resized.
 */
function initializeArtwork() {
  // Clear all existing arrays to start fresh.
  wheels = [];
  connectors = [];
  dandelionParticles = []; // Clear particles on re-initialization.
  blownAwayHistory = []; // Clear history on re-initialization.

  const numWheels = 25; // Defines the target number of wheels to be generated for a denser composition.
  const minRadius = width * 0.04; // Minimum radius for a wheel, relative to canvas width.
  const maxRadius = width * 0.12; // Maximum radius for a wheel, relative to canvas width.
  const maxAttempts = 5000; // Maximum attempts to place a wheel, preventing infinite loops.
  let currentAttempts = 0; // Counter for placement attempts.

  /**
   * Generate Wheels with Optimized Packing: This loop attempts to place wheels
   * randomly while minimizing excessive overlap and ensuring connectivity.
   */
  while (wheels.length < numWheels && currentAttempts < maxAttempts) {
    let candidateRadius = random(minRadius, maxRadius); // Propose a random radius for the new wheel.
    let candidateX = random(candidateRadius, width - candidateRadius); // Propose a random X position.
    let candidateY = random(candidateRadius, height - candidateRadius); // Propose a random Y position.

    let isOverlappingTooMuch = false; // Flag to check if the candidate wheel overlaps excessively.
    let hasNearbyWheel = false; // Flag to check if the candidate wheel is close enough to existing wheels.

    // Check against all existing wheels for overlap and proximity.
    for (let other of wheels) {
      let d = dist(candidateX, candidateY, other.x, other.y); // Calculate distance between centers.
      let combinedRadius = candidateRadius + other.radius; // Sum of their radii.

      // Allow for significant overlap, as seen in Pacita Abad's original work.
      const overlapThreshold = min(candidateRadius, other.radius) * 0.4; // Allow up to 40% overlap of the smaller radius.
      if (d < combinedRadius - overlapThreshold) {
        isOverlappingTooMuch = true; // Mark as excessively overlapping.
        break; // No need to check further if overlap is too much.
      }
      // Check if it's within a reasonable distance to form a connection.
      if (d < combinedRadius * 1.5) { // Can be connected if within 1.5 times their combined radius.
        hasNearbyWheel = true; // Mark as having a potential neighbor.
      }
    }

    // The first wheel doesn't require any nearby neighbors.
    if (wheels.length === 0) {
      hasNearbyWheel = true;
    }

    // Add the wheel if it's not excessively overlapping and has a potential neighbor (or is the first wheel).
    if (!isOverlappingTooMuch && hasNearbyWheel) {
      let selectedPalette = random(colorPalettes); // Pick a random color palette.
      // Ensure diversity: avoid using the same palette consecutively.
      if (wheels.length > 0 && selectedPalette === wheels[wheels.length - 1].colors) {
        selectedPalette = random(colorPalettes.filter(p => p !== selectedPalette)); // Select a different palette.
      }
      wheels.push(new Wheel(candidateX, candidateY, candidateRadius, selectedPalette)); // Add the new Wheel object.
    }
    currentAttempts++; // Increment attempt counter.
  }

  // Log a message if not all wheels could be placed within the maximum attempts.
  if (currentAttempts >= maxAttempts) {
    console.log("Could not place all wheels within limits.");
  }

  /**
   * Generate Connectors: Creates connections between nearby wheels to mimic
   * the chain-like elements in the original artwork.
   */
  for (let i = 0; i < wheels.length; i++) {
    for (let j = i + 1; j < wheels.length; j++) { // Avoid duplicate connections and self-connection.
      let w1 = wheels[i];
      let w2 = wheels[j];
      let d = dist(w1.x, w1.y, w2.x, w2.y); // Calculate distance between wheel centers.
      // Connect wheels if they are within a certain range (allowing for some gap or slight overlap).
      if (d < (w1.radius + w2.radius) * 1.3) { // Connect if distance is within 1.3 times their combined radii.
        connectors.push(new Connector(w1, w2, random(colorPalettes)[0])); // Add a new Connector with a random base color.
      }
    }
  }
}

/**
 * --- Wheel Class ---
 * Represents a single circular "wheel" element in the artwork.
 * It handles its position, size, colors, and drawing its various components.
 */
class Wheel {
  /**
   * Constructor: Initializes a new Wheel object with its position, radius, and color palette.
   * @param {number} x - The x-coordinate of the wheel's center.
   * @param {number} y - The y-coordinate of the wheel's center.
   * @param {number} radius - The radius of the wheel.
   * @param {string[]} palette - An array of color strings for the wheel's components.
   */
  constructor(x, y, radius, palette) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.colors = palette; // Stores the assigned color palette.
    this.stemAngle = random(TWO_PI); // Random angle for the decorative "stem" element.
    this.isBlownAway = false; // Flag to indicate if the wheel's inner patterns have been "blown away."

    // Properties for fade-in effect of inner patterns.
    this.innerAlpha = 0; // Current transparency of inner patterns (starts fully transparent).
    this.targetInnerAlpha = 255; // Target opacity (fully opaque).
    this.fadeSpeed = 5; // Rate at which the alpha value changes.
  }

  /**
   * Display Method: Draws all the components of the wheel on the canvas.
   * It uses `push()` and `pop()` to isolate transformations for each wheel.
   */
  display() {
    push(); // Save the current drawing style and transformations.
    translate(this.x, this.y); // Move the origin to the center of the wheel.

    this.drawBaseCircle(); // Draw the main circular base.

    // Only draw the outer dots and spokes if the wheel has not been "blown away".
    // These elements will fade in based on `innerAlpha`.
    if (!this.isBlownAway) {
      this.drawOuterDots();
      this.drawSpokes();
    }
    this.drawInnerCircles(); // Draw the nested inner circles.
    this.drawStem(); // Draw the decorative stem element.

    pop(); // Restore the previous drawing style and transformations.
  }

  /**
   * Update Alpha Method: Manages the fade-in effect for the wheel's inner patterns.
   * If the wheel is blown away, its inner patterns become fully transparent.
   */
  updateAlpha() {
    if (this.isBlownAway) {
      this.innerAlpha = 0; // If blown away, immediately make inner patterns invisible.
    } else {
      // Gradually increase innerAlpha towards the target (255) for a fade-in effect.
      if (this.innerAlpha < this.targetInnerAlpha) {
        this.innerAlpha = min(this.innerAlpha + this.fadeSpeed, this.targetInnerAlpha);
      }
    }
  }

  /**
   * Draw Base Circle Method: Draws the outermost, solid circle of the wheel.
   */
  drawBaseCircle() {
    noStroke(); // No outline for the base circle.
    fill(this.colors[0]); // Use the first color from the palette for the base.
    circle(0, 0, this.radius * 2); // Draw a circle at the origin (relative to translated canvas).
  }

  /**
   * Draw Outer Dots Method: Draws a ring of small dots around the outer edge of the wheel.
   * The color of these dots is affected by the `innerAlpha` for fading.
   */
  drawOuterDots() {
    const dotCount = 40; // Number of dots in the outer ring.
    const dotRadius = this.radius * 0.9; // Radius on which the dots are placed.
    const dotSize = this.radius * 0.08; // Size of each individual dot.

    // Apply the current `innerAlpha` to the dot color for the fade-in effect.
    let dotColor = color(this.colors[1]);
    dotColor.setAlpha(this.innerAlpha);
    fill(dotColor); // Set fill color for the dots.
    noStroke(); // No outline for the dots.

    // Loop to draw each dot at its calculated position.
    for (let i = 0; i < dotCount; i++) {
      const angle = map(i, 0, dotCount, 0, TWO_PI); // Calculate angle for even distribution.
      const dx = cos(angle) * dotRadius; // X-offset from the center.
      const dy = sin(angle) * dotRadius; // Y-offset from the center.
      circle(dx, dy, dotSize); // Draw the dot.
    }
  }

  /**
   * Draw Spokes Method: Draws radial lines (spokes) extending from the center of the wheel.
   * The color of these spokes is affected by the `innerAlpha` for fading.
   */
  drawSpokes() {
    const spokeCount = 24; // Number of spokes.
    const innerRadius = this.radius * 0.55; // Inner starting point for spokes.
    const outerRadius = this.radius * 0.8; // Outer ending point for spokes.

    // Apply the current `innerAlpha` to the spoke color for the fade-in effect.
    let spokeColor = color(this.colors[3]);
    spokeColor.setAlpha(this.innerAlpha);
    stroke(spokeColor); // Set stroke color for the spokes.
    strokeWeight(this.radius * 0.03); // Set stroke thickness.

    // Loop to draw each spoke.
    for (let i = 0; i < spokeCount; i++) {
      const angle = map(i, 0, spokeCount, 0, TWO_PI); // Calculate angle for even distribution.
      const x1 = cos(angle) * innerRadius; // Inner X-coordinate.
      const y1 = sin(angle) * innerRadius; // Inner Y-coordinate.
      const x2 = cos(angle) * outerRadius; // Outer X-coordinate.
      const y2 = sin(angle) * outerRadius; // Outer Y-coordinate.
      line(x1, y1, x2, y2); // Draw the line segment.
    }
  }

  /**
   * Draw Inner Circles Method: Draws several concentric circles and a ring of dots
   * towards the center of the wheel, creating layered patterns.
   */
  drawInnerCircles() {
    noStroke(); // No outline for these circles.

    fill(this.colors[2]); // Use the third color for the first inner circle.
    circle(0, 0, this.radius * 0.6); // Draw the first inner circle.

    fill(this.colors[3]); // Use the fourth color for the inner dots.
    const innerDotCount = 20; // Number of dots in the inner ring.
    const innerDotRadius = this.radius * 0.4; // Radius on which inner dots are placed.
    const innerDotSize = this.radius * 0.06; // Size of each inner dot.

    // Loop to draw each inner dot.
    for (let i = 0; i < innerDotCount; i++) {
      const angle = map(i, 0, innerDotCount, 0, TWO_PI); // Calculate angle.
      const dx = cos(angle) * innerDotRadius; // X-offset.
      const dy = sin(angle) * innerDotRadius; // Y-offset.
      circle(dx, dy, innerDotSize); // Draw the inner dot.
    }

    fill(this.colors[4]); // Use the fifth color for the second inner circle.
    circle(0, 0, this.radius * 0.3); // Draw the second inner circle.

    fill(this.colors[0]); // Reuse the first color for the smallest central circle.
    circle(0, 0, this.radius * 0.15); // Draw the smallest central circle.
  }

  /**
   * Draw Stem Method: Draws a decorative, curved "stem" or accent originating
   * from the center of the wheel.
   */
  drawStem() {
    stroke(this.colors[1]); // Use the second color for the stem's stroke.
    strokeWeight(this.radius * 0.04); // Set stem thickness.
    noFill(); // No fill for the stem curve.

    // Define start, end, and control points for a quadratic Bezier curve.
    const startX = cos(this.stemAngle) * (this.radius * 0.075);
    const startY = sin(this.stemAngle) * (this.radius * 0.075);
    const endX = cos(this.stemAngle) * (this.radius * 0.5);
    const endY = sin(this.stemAngle) * (this.radius * 0.5);
    const controlX = cos(this.stemAngle + 0.5) * (this.radius * 0.4);
    const controlY = sin(this.stemAngle + 0.5) * (this.radius * 0.4);

    beginShape(); // Begin custom shape drawing.
    vertex(startX, startY); // Start point of the curve.
    quadraticVertex(controlX, controlY, endX, endY); // Define quadratic Bezier curve.
    endShape(); // End custom shape.

    noStroke(); // No stroke for the circle at the end of the stem.
    fill(this.colors[1]); // Fill with the second color.
    circle(endX, endY, this.radius * 0.08); // Draw a circle at the end of the stem.
  }

  /**
   * Contains Method: Checks if a given point (px, py) is within the bounds of the wheel.
   * Useful for mouse interaction.
   * @param {number} px - The x-coordinate of the point to check.
   * @param {number} py - The y-coordinate of the point to check.
   * @returns {boolean} - True if the point is inside the wheel, false otherwise.
   */
  contains(px, py) {
    let d = dist(px, py, this.x, this.y); // Calculate distance from the point to the wheel's center.
    return d < this.radius; // Return true if distance is less than the radius.
  }
}

/**
 * --- Connector Class ---
 * Represents a visual connection between two Wheel objects, mimicking chain-like elements.
 */
class Connector {
  /**
   * Constructor: Initializes a new Connector object, linking two wheels.
   * @param {Wheel} wheel1 - The first Wheel object to connect.
   * @param {Wheel} wheel2 - The second Wheel object to connect.
   * @param {string} connectColor - The color for the connector and its decorative elements.
   */
  constructor(wheel1, wheel2, connectColor) {
    this.w1 = wheel1; // Reference to the first wheel.
    this.w2 = wheel2; // Reference to the second wheel.
    this.color = connectColor; // Color of the connector.

    // Pre-calculate angle and start/end points for drawing efficiency.
    this.angle = atan2(this.w2.y - this.w1.y, this.w2.x - this.w1.x); // Angle from w1 to w2.
    this.startPoint = createVector(
      this.w1.x + cos(this.angle) * this.w1.radius, // Point on the edge of w1.
      this.w1.y + sin(this.angle) * this.w1.radius
    );
    this.endPoint = createVector(
      this.w2.x + cos(this.angle + PI) * this.w2.radius, // Point on the edge of w2 (opposite side of the angle).
      this.w2.y + sin(this.angle + PI) * this.w2.radius
    );
  }

  /**
   * Display Method: Draws the connector line and its decorative chain-like elements.
   */
  display() {
    stroke(this.color); // Set stroke color for the main connection line.
    strokeWeight(5); // Thicker line for better visibility.
    noFill(); // No fill for the line itself.

    // Draw the main connection line between the two wheels.
    line(this.startPoint.x, this.startPoint.y, this.endPoint.x, this.endPoint.y);

    // Add decorative elements for the chain-like effect, inspired by the original artwork.
    let midX = (this.startPoint.x + this.endPoint.x) / 2; // Midpoint X for central decorations.
    let midY = (this.startPoint.y + this.endPoint.y) / 2; // Midpoint Y for central decorations.
    let distBetweenWheels = dist(this.startPoint.x, this.startPoint.y, this.endPoint.x, this.endPoint.y); // Total length of the connector.

    // Draw chain links along the line.
    const linkSize = 10; // Size of individual chain links.
    const numLinks = floor(distBetweenWheels / (linkSize * 1.5)); // Calculate number of links based on distance.
    if (numLinks > 0) {
      for (let i = 0; i <= numLinks; i++) {
        let lerpAmount = map(i, 0, numLinks, 0, 1); // Interpolation amount for positioning links.
        let linkX = lerp(this.startPoint.x, this.endPoint.x, lerpAmount); // X position of the link.
        let linkY = lerp(this.startPoint.y, this.endPoint.y, lerpAmount); // Y position of the link.

        // Draw small circles to represent chain links.
        fill(255, 200, 100); // Yellow-orange color for links.
        stroke(this.color); // Border matching the connection line color.
        strokeWeight(1);
        circle(linkX, linkY, linkSize);

        // Optional: Add a tiny inner dot for more detail on each link.
        fill(0); // Black fill for inner dot.
        noStroke();
        circle(linkX, linkY, linkSize * 0.4);
      }
    }

    // Draw a decorative central blob, inspired by YZH's connecting point.
    fill(255, 255, 255); // White base for the central blob.
    stroke(this.color); // Border matching the connection line.
    strokeWeight(3);
    circle(midX, midY, 20); // Larger central circle.

    fill(this.color); // Inner color matching the connection.
    noStroke();
    circle(midX, midY, 10); // Smaller inner circle.

    // Draw radiating dots around the central blob for additional detail.
    fill(255, 200, 100); // Yellow-orange for small dots.
    noStroke();
    const numSmallDots = 8; // Number of radiating dots.
    const smallDotRadius = 15; // Radius on which these dots radiate.
    const smallDotSize = 4; // Size of each small dot.
    for (let i = 0; i < numSmallDots; i++) {
      let angle = map(i, 0, numSmallDots, 0, TWO_PI); // Angle for even distribution.
      let dx = midX + cos(angle) * smallDotRadius; // X position of the dot.
      let dy = midY + sin(angle) * smallDotRadius; // Y position of the dot.
      circle(dx, dy, smallDotSize); // Draw the small dot.
    }
  }
}

/**
 * --- Dandelion Particle Class ---
 * Represents a single particle that "blows away" from a wheel,
 * creating a dandelion-like effect. These particles can also return to their origin.
 */
class DandelionParticle {
  /**
   * Constructor: Initializes a new DandelionParticle.
   * @param {number} x - Initial x-coordinate of the particle.
   * @param {number} y - Initial y-coordinate of the particle.
   * @param {string} type - The type of particle ('spoke' or 'outerDot'), influencing its appearance.
   * @param {string} color - The color of the particle.
   * @param {number} size - The initial size of the particle.
   * @param {number} targetX - The x-coordinate this particle should return to (its original position).
   * @param {number} targetY - The y-coordinate this particle should return to (its original position).
   * @param {number} [initialAngle=0] - Initial rotation angle for 'spoke' particles.
   */
  constructor(x, y, type, color, size, targetX, targetY, initialAngle = 0) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.color = color;
    this.size = size;
    this.alpha = 255; // Initial opacity (fully opaque) for fading out.

    this.originalX = x; // Stores the initial x-position for reference.
    this.originalY = y; // Stores the initial y-position for reference.
    this.targetX = targetX; // Target x-coordinate for return animation.
    this.targetY = targetY; // Target y-coordinate for return animation.

    // Initial velocity directed towards the bottom-left, mimicking a gentle wind.
    this.vel = p5.Vector.fromAngle(random(PI + PI / 4, PI + PI / 2)); // Angle range for bottom-left.
    this.vel.mult(random(1, 3)); // Random initial speed.

    this.rotation = initialAngle; // Initial rotation for 'spoke' particles.
    this.rotationSpeed = random(-0.05, 0.05); // Random rotation speed for 'spoke' particles.
    this.windX = random(-0.05, -0.2); // Gentle horizontal wind force to the left.
    this.windY = random(0.05, 0.2); // Gentle vertical wind force downwards.

    this.isReturning = false; // Flag to indicate if the particle is animating back to its origin.
    this.returnSpeed = 0.05; // Speed at which the particle lerps (interpolates) back to its target.
  }

  /**
   * Update Method: Updates the particle's position, rotation, size, and alpha over time.
   * Handles both "blowing away" and "returning" animations.
   */
  update() {
    if (this.isReturning) {
      // If returning, interpolate position back to the target and fade out.
      this.x = lerp(this.x, this.targetX, this.returnSpeed);
      this.y = lerp(this.y, this.targetY, this.returnSpeed);
      this.alpha = lerp(this.alpha, 0, this.returnSpeed * 2); // Fade OUT as it returns to merge with the wheel.
      this.size = lerp(this.size, (this.type === 'spoke' ? this.size / 5 : this.size), this.returnSpeed * 2); // Restore size (spokes shrink significantly).
      this.rotationSpeed = lerp(this.rotationSpeed, 0, 0.05); // Stop rotation as it returns.

    } else {
      // If blowing away, apply velocity and wind forces, then fade out and shrink.
      this.x += this.vel.x; // Update x-position based on velocity.
      this.y += this.vel.y; // Update y-position based on velocity.
      this.vel.add(this.windX, this.windY); // Apply continuous wind force.

      this.rotation += this.rotationSpeed; // Update rotation for 'spoke' particles.

      this.alpha -= 2; // Gradually decrease alpha (fade out).
      this.size *= 0.99; // Gradually shrink the particle.
    }
  }

  /**
   * Display Method: Draws the particle on the canvas based on its type and current properties.
   */
  display() {
    push(); // Save current drawing state.
    translate(this.x, this.y); // Move origin to particle's position.
    rotate(this.rotation); // Apply rotation for 'spoke' particles.
    noStroke(); // No outline for particles.
    // Set fill color, applying the current alpha for fading.
    fill(red(this.color), green(this.color), blue(this.color), this.alpha);

    if (this.type === 'outerDot' || this.type === 'innerDot') {
      circle(0, 0, this.size); // Draw a circle for dot-type particles.
    } else if (this.type === 'spoke') {
      // Draw a line segment for spoke-type particles.
      stroke(red(this.color), green(this.color), blue(this.color), this.alpha); // Apply color and alpha to stroke.
      strokeWeight(this.size * 0.3); // Adjust stroke weight for visibility.
      line(0, 0, this.size, 0); // Draw a line from origin, which will be rotated.
    }
    pop(); // Restore previous drawing state.
  }
}

/**
 * mousePressed Function: Event handler for mouse clicks.
 * When a wheel is clicked, it triggers the "dandelion effect" for all wheels
 * sharing the same base color, causing their inner patterns to disappear and
 * particles to fly away.
 */
function mousePressed() {
  // Iterate through wheels in reverse order to safely remove/modify elements if needed.
  for (let i = wheels.length - 1; i >= 0; i--) {
    let wheel = wheels[i];
    // Check if the mouse is over a wheel and if that wheel has not already been blown away.
    if (wheel.contains(mouseX, mouseY) && !wheel.isBlownAway) {
      // Find all wheels that share the same base color as the clicked wheel.
      const clickedWheelBaseColor = wheel.colors[0];
      const wheelsToBlow = wheels.filter(w => w.colors[0] === clickedWheelBaseColor && !w.isBlownAway);

      if (wheelsToBlow.length > 0) {
        // Record the state of these wheels before they are blown away, for potential undo.
        blownAwayHistory.push(wheelsToBlow.map(w => w)); // Store copies of the affected wheels.

        // Process each wheel that needs to be blown away.
        for (const w of wheelsToBlow) {
          w.isBlownAway = true; // Mark the wheel as blown away (its inner patterns will now be invisible).
          w.innerAlpha = 0; // Immediately set its inner pattern alpha to 0.

          /**
           * Generate dandelion particles for spokes:
           * Each spoke of the wheel becomes a particle.
           */
          const spokeCount = 24;
          const innerRadius = w.radius * 0.55;
          const outerRadius = w.radius * 0.8;
          const spokeColor = w.colors[3]; // Color of the spokes.
          const spokeSize = w.radius * 0.03; // Base size for spoke particles.

          for (let j = 0; j < spokeCount; j++) {
            const angle = map(j, 0, spokeCount, 0, TWO_PI);
            // Particles start at the outer end of the spoke.
            const startX = w.x + cos(angle) * outerRadius;
            const startY = w.y + sin(angle) * outerRadius;
            const targetX = w.x + cos(angle) * outerRadius; // Target for return (original position).
            const targetY = w.y + sin(angle) * outerRadius; // Target for return (original position).
            dandelionParticles.push(new DandelionParticle(startX, startY, 'spoke', spokeColor, spokeSize * 5, targetX, targetY, angle));
          }

          /**
           * Generate dandelion particles for outer dots:
           * Each outer dot of the wheel becomes a particle.
           */
          const dotCount = 40;
          const dotRadius = w.radius * 0.9;
          const dotColor = w.colors[1]; // Color of outer dots.
          const dotSize = w.radius * 0.08; // Base size for dot particles.

          for (let j = 0; j < dotCount; j++) {
            const angle = map(j, 0, dotCount, 0, TWO_PI);
            const dx = w.x + cos(angle) * dotRadius;
            const dy = w.y + sin(angle) * dotRadius;
            const targetX = w.x + cos(angle) * dotRadius; // Target for return (original position).
            const targetY = w.y + sin(angle) * dotRadius; // Target for return (original position).
            dandelionParticles.push(new DandelionParticle(dx, dy, 'outerDot', dotColor, dotSize, targetX, targetY));
          }
        }
      }
      break; // Only process one wheel click at a time, preventing multiple effects from a single click.
    }
  }
}

/**
 * keyPressed Function: Event handler for keyboard presses.
 * Specifically, pressing the spacebar (keyCode 32) triggers an "undo" action,
 * restoring the last set of "blown away" wheels and animating particles back to them.
 */
function keyPressed() {
  if (keyCode === 32) { // Check if the pressed key is the spacebar.
    if (blownAwayHistory.length > 0) { // Ensure there's something to undo.
      // Retrieve the last set of wheels that were blown away from history.
      const wheelsToRestore = blownAwayHistory.pop();

      // Process each wheel that needs to be restored.
      for (const w of wheelsToRestore) {
        w.isBlownAway = false; // Mark the wheel as not blown away (its inner patterns will now fade in).
        w.innerAlpha = 0; // Explicitly set alpha to 0 to trigger the fade-in animation from transparent.

        // Animate particles back to the wheel: Find particles that originated from this wheel.
        const particlesToReturn = dandelionParticles.filter(p =>
          // The condition checks if the particle's original target position is near the wheel's spoke/outer dot radius.
          (p.type === 'spoke' && dist(p.targetX, p.targetY, w.x + cos(p.rotation) * w.radius * 0.8, w.y + sin(p.rotation) * w.radius * 0.8) < 10) ||
          (p.type === 'outerDot' && dist(p.targetX, p.targetY, w.x + cos(atan2(p.targetY - w.y, p.targetX - w.x)) * w.radius * 0.9, w.y + sin(atan2(p.targetY - w.y, p.targetX - w.x)) * w.radius * 0.9) < 10)
        );

        // For each particle found, initiate its return animation.
        for (const p of particlesToReturn) {
          p.isReturning = true; // Set the flag to true to start the return animation.
          // Store the particle's current position as its starting point for the return animation.
          p.originalX = p.x;
          p.originalY = p.y;
          // Particles will fade out as they return and merge with the wheel's restored appearance.
        }
      }
    }
  }
}

/**
 * windowResized Function: Event handler for when the browser window is resized.
 * It adjusts the canvas size and re-initializes the artwork to fit the new dimensions.
 */
function windowResized() {
  resizeCanvas(windowWidth, windowHeight); // Resize the canvas to match the new window dimensions.
  initializeArtwork(); // Re-initialize wheels and connectors to adapt to the new canvas size.
}
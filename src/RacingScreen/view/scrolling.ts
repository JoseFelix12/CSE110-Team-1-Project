/**
 * Draws a repeating tile across the screen, shifted by the camera.
 * parallax is how fast the tile moves compared to the road (1 = same speed).
 * drawTile receives the tile's screen x and its index in the world, so the
 * same tile always looks the same as it scrolls past.
 */
export function drawRepeating(
    cameraX: number,
    parallax: number,
    tileWidth: number,
    screenWidth: number,
    drawTile: (x: number, index: number) => void,
): void {
    const scrolled = cameraX * parallax;
    const firstIndex = Math.floor(scrolled / tileWidth);
    const offset = Math.round(firstIndex * tileWidth - scrolled);
    for (let i = 0; offset + i * tileWidth < screenWidth; i++) {
        drawTile(offset + i * tileWidth, firstIndex + i);
    }
}

/**
 * Gets a repeatable pseudo-random integer in [0, max) for a world index
 */
export function variation(index: number, max: number): number {
    const value = Math.abs(Math.sin(index * 12.9898) * 43758.5453);
    return Math.floor((value - Math.floor(value)) * max);
}

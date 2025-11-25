/**
 * Generate a color for a medication emoji based on the medication name
 * This ensures the same medication always gets the same color
 */
export function getMedicationEmojiColor(medicationName: string): string {
    // Simple hash function to generate a consistent number from a string
    let hash = 0
    for (let i = 0; i < medicationName.length; i++) {
        hash = medicationName.charCodeAt(i) + ((hash << 5) - hash)
        hash = hash & hash // Convert to 32bit integer
    }

    // Generate HSL color with good saturation and lightness for visibility
    const hue = Math.abs(hash % 360)
    const saturation = 65 + (Math.abs(hash % 20)) // 65-85%
    const lightness = 45 + (Math.abs(hash % 15)) // 45-60%

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

/**
 * Helper hash function
 */
function hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash)
        hash = hash & hash
    }
    return Math.abs(hash)
}

/**
 * Render a colored emoji by wrapping it in a span with filter
 * Uses CSS filters to colorize the emoji
 */
export function getColoredEmoji(emoji: string, medicationName: string) {
    const color = getMedicationEmojiColor(medicationName)

    return {
        display: 'inline-block',
        filter: `hue-rotate(${Math.abs(hashString(medicationName) % 360)}deg) saturate(1.5)`,
    }
}

/**
 * Alternative: Create a colored circle background for medication icon
 * This provides better color differentiation
 */
export function getMedicationIconStyle(medicationName: string) {
    const color = getMedicationEmojiColor(medicationName)

    return {
        backgroundColor: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '2.5rem',
        height: '2.5rem',
        borderRadius: '50%',
    }
}

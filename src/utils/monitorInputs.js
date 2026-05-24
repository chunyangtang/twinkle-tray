export const inputSourceVCP = "0x60"

const inputSourceNames = {
    1: "VGA-1",
    2: "VGA-2",
    3: "DVI-1",
    4: "DVI-2",
    5: "Composite video 1",
    6: "Composite video 2",
    7: "S-Video-1",
    8: "S-Video-2",
    9: "Tuner-1",
    10: "Tuner-2",
    11: "Tuner-3",
    12: "Component video 1",
    13: "Component video 2",
    14: "Component video 3",
    15: "DisplayPort-1",
    16: "DisplayPort-2",
    17: "HDMI-1",
    18: "HDMI-2"
}

export function getInputSourceName(value) {
    const inputValue = parseInt(value)
    if (inputSourceNames[inputValue]) return inputSourceNames[inputValue]
    if (Number.isNaN(inputValue)) return "Input"
    return `Input 0x${inputValue.toString(16).toUpperCase()}`
}

export function getInputSourceValue(inputFeature) {
    if (Array.isArray(inputFeature)) return parseInt(inputFeature[0])
    return parseInt(inputFeature)
}

export function getInputSources(monitor) {
    const inputFeature = monitor?.features?.[inputSourceVCP]
    if (!Array.isArray(inputFeature) || !Array.isArray(inputFeature[1])) {
        return []
    }
    return inputFeature[1]
        .map(input => parseInt(input))
        .filter(input => !Number.isNaN(input))
}

export function hasInputSources(monitor) {
    return getInputSources(monitor).length > 0
}

export function inputSourcesEnabled(settings, monitor) {
    const monitorID = monitor?.hwid?.[1]
    if (!monitorID) return false
    return settings?.monitorFeatures?.[monitorID]?.[inputSourceVCP] !== false
}

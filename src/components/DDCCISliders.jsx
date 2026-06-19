import React, { useEffect, useMemo, useState } from "react"
import { useObject } from "../hooks/useObject"
import Slider from "./Slider"
import { getConnectorName, getInputSourceConnectorMatches, getInputSourceMarkName, getInputSourceMarks, getInputSourceName, getInputSources, getNextInputSourceMark, inputSourceVCP, inputSourcesEnabled } from "../utils/monitorInputs"

export default function DDCCISliders(props) {
    const { monitor, monitorFeatures } = props

    const defaultValues = useMemo(() => {
        const values = {}
        for (const vcp in monitor?.features) {
            values[vcp] = vcp === inputSourceVCP
                ? monitor?.features?.[vcp] ?? 0
                : monitor?.features?.[vcp]?.[0] ?? 0
        }
        return values
    }, [monitor?.features])

    const [values, setValues] = useObject(defaultValues)
    const [inputMarks, setInputMarks] = useState(() => getInputSourceMarks(window.settings, monitor))
    const inputSources = getInputSources(monitor)
    const connectorName = getConnectorName(monitor?.connector)
    const connectorMatches = getInputSourceConnectorMatches(inputSources, monitor?.connector)
    const localInputSource = connectorMatches.length === 1 ? connectorMatches[0] : false
    const showInputSources = monitor?.type === "ddcci"
        && inputSources.length > 0
        && inputSourcesEnabled(window.settings, monitor)

    useEffect(() => {
        setValues(defaultValues)
    }, [defaultValues])

    useEffect(() => {
        setInputMarks(getInputSourceMarks(window.settings, monitor))
    }, [monitor?.hwid?.[1], window.settings?.monitorInputMarks])

    const changeInputsState = (code) => {
        setValues({ [inputSourceVCP]: [code, [...inputSources]] })
    }

    const cycleInputMark = (input) => {
        const monitorID = monitor?.hwid?.[1]
        if (!monitorID) return false;

        const inputKey = `${input}`
        const nextMark = getNextInputSourceMark(inputMarks?.[inputKey])
        const nextInputMarks = { ...(inputMarks ?? {}) }

        if (nextMark) {
            nextInputMarks[inputKey] = nextMark
        } else {
            delete nextInputMarks[inputKey]
        }

        setInputMarks(nextInputMarks)

        const monitorInputMarks = JSON.parse(JSON.stringify(window.settings?.monitorInputMarks ?? {}))
        if (Object.keys(nextInputMarks).length > 0) {
            monitorInputMarks[monitorID] = nextInputMarks
        } else {
            delete monitorInputMarks[monitorID]
        }

        window.settings.monitorInputMarks = monitorInputMarks
        window.sendSettings({ monitorInputMarks })
    }

    let extraHTML = []
    const featureSettings = window.settings?.monitorFeaturesSettings?.[monitor?.hwid[1]]

    if (monitor?.features) {
        let i = 0
        for (const vcp in monitor.features) {
            i++

            if (vcp == "0x10" || vcp == "0x13" || vcp == "0xD6") {
                continue; // Skip if brightness or power state
            }

            const feature = monitor.features[vcp]

            if (vcp === inputSourceVCP) {
                // Input source buttons are shown by default for DDC/CI displays, with the settings toggle acting as an opt-out.
                if (feature && showInputSources && !(featureSettings?.[vcp]?.linked)) {
                    extraHTML.push(
                        <div className="feature-row feature-inputs" key={monitor.key + "_" + vcp}>
                            <div className="feature-icon"><span className="icon vfix">&#xE839;</span></div>
                            <div className="input-source-controls">
                                {connectorName ? <div className="input-source-connection">This PC: {connectorName}</div> : null}
                                <div className="input-source-buttons">
                                    {inputSources.map(input => {
                                        const local = localInputSource === input
                                        const mark = inputMarks?.[`${input}`]
                                        return (
                                            <button
                                                key={input + monitor.id}
                                                className="button input-source-button"
                                                data-local={local}
                                                data-mark={mark || undefined}
                                                title={getInputSourceTitle(input, local, connectorName, mark)}
                                                type="button"
                                                onContextMenu={(e) => {
                                                    e.preventDefault()
                                                    cycleInputMark(input)
                                                }}
                                                onClick={() => {
                                                    setVCP(monitor.id, parseInt(vcp), input)
                                                    changeInputsState(input)
                                                }}>
                                                {getInputSourceName(input)}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    )
                }
                continue;
            }

            if (feature && monitorFeatures?.[vcp] && !(featureSettings?.[vcp]?.linked)) {
                // Feature has a value, is enabled, and not linked
                if (vcp === "0x12") {
                    // Contrast
                    extraHTML.push(
                        <div className="feature-row feature-contrast" key={monitor.key + "_" + vcp}>
                            <div className="feature-icon"><span className="icon vfix">&#xE793;</span></div>
                            <Slider type="contrast" monitorID={monitor.id} level={values[vcp]} monitorName={monitor.name} monitortype={monitor.type} onChange={val => { setValues({ [vcp]: val }); setVCP(monitor.id, parseInt(vcp), val * (monitor.features[vcp][1] / 100)) }} scrollAmount={props.scrollAmount} />
                        </div>
                    )
                } else if (vcp === "0x62") {
                    // Volume
                    extraHTML.push(
                        <div className="feature-row feature-volume" key={monitor.key + "_" + vcp}>
                            <div className="feature-icon"><span className="icon vfix">&#xE767;</span></div>
                            <Slider type="volume" monitorID={monitor.id} level={values[vcp]} monitorName={monitor.name} monitortype={monitor.type} onChange={val => { setValues({ [vcp]: val }); setVCP(monitor.id, parseInt(vcp), val * (monitor.features[vcp][1] / 100)) }} scrollAmount={props.scrollAmount} />
                        </div>
                    )
                } else {
                    // Custom
                    const settings = featureSettings?.[vcp] ?? {}
                    let icon
                    if (settings?.iconType === "windows" && settings?.icon) {
                        icon = (<span className="icon vfix" dangerouslySetInnerHTML={{ __html: `&#x${settings.icon};` }}></span>)
                    } else if (settings?.iconType === "text" && settings?.iconText) {
                        icon = (<span className="icon icon-text vfix">{settings.iconText}</span>)
                    } else {
                        // Default
                        icon = (<span className="icon vfix">&#xe897;</span>)
                    }
                    extraHTML.push(
                        <div className="feature-row feature-volume" key={monitor.key + "_" + vcp}>
                            <div className="feature-icon">{icon}</div>
                            <Slider type="custom" monitorID={monitor.id} level={values[vcp]} monitorName={monitor.name} monitortype={monitor.type} onChange={val => { setValues({ [vcp]: val }); setVCP(monitor.id, parseInt(vcp), val * (monitor.features[vcp][1] / 100)) }} scrollAmount={props.scrollAmount} />
                        </div>
                    )
                }
            }

        }
    }

    return (
        <>
            {extraHTML}
        </>
    )
}

function setVCP(monitor, code, value) {
    window.dispatchEvent(new CustomEvent("setVCP", {
        detail: {
            monitor,
            code,
            value
        }
    }))
}

function getInputSourceTitle(input, local, connectorName, mark) {
    const notes = []
    if (local && connectorName) notes.push(`This PC connection: ${connectorName}`)
    if (mark) notes.push(`Marker: ${getInputSourceMarkName(mark)}`)

    if (notes.length === 0) return getInputSourceName(input)
    return `${getInputSourceName(input)}\n${notes.join("\n")}`
}

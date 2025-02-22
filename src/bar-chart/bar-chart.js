import * as array from 'd3-array'
import * as scale from 'd3-scale'
import * as shape from 'd3-shape'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { View, TouchableWithoutFeedback, } from 'react-native'
import Svg, { Text, Line } from 'react-native-svg'
import { xAxisLocations } from 'react-native-svg-charts/src/x-axis'
import Path from '../animated-path'

class BarChart extends PureComponent {
    state = {
        width: 0,
        height: 0,
    }

    _onLayout(event) {
        const {
            nativeEvent: {
                layout: { height, width },
            },
        } = event
        this.setState({ height, width })
    }

    calcXScale(domain) {
        const {
            horizontal,
            contentInset: { left = 0, right = 0 },
            spacingInner,
            spacingOuter,
            clamp,
        } = this.props

        const { width } = this.state

        if (horizontal) {
            return scale
                .scaleLinear()
                .domain(domain).nice()
                .range([left, width - right])
                .clamp(clamp)
        }

        return scale
            .scaleBand()
            .domain(domain)
            .range([left, width - right])
            .paddingInner([spacingInner])
            .paddingOuter([spacingOuter])
    }

    calcYScale(domain) {
        const {
            horizontal,
            contentInset: { top = 0, bottom = 0 },
            spacingInner,
            spacingOuter,
            clamp,
        } = this.props

        const { height } = this.state

        if (horizontal) {
            return scale
                .scaleBand()
                .domain(domain)
                .range([top, height - bottom])
                .paddingInner([spacingInner])
                .paddingOuter([spacingOuter])
        }

        return scale
            .scaleLinear()
            .domain(domain)
            .nice()
            .range([height - bottom, top])
            .clamp(clamp)
    }

    calcAreas(x, y) {
        const { horizontal, data, yAccessor,} = this.props

        const values = data.map((item) => yAccessor({ item }))

        if (horizontal) {
            return data.map((bar, index) => {
                return {
                    bar,
                    path: shape
                        .area()
                        .y((value, _index) => (_index === 0 ? y(index) : y(index) + y.bandwidth()))
                        .x0(x(0))
                        .x1((value) => x(value))
                        .defined((value) => typeof value === 'number')([values[index], values[index]]),
                }
            })
        }

        let final = data.map((bar, index) => {
            const result = { }
            result.bar = bar;
            result.path = shape
                .area()
                .y0(y(0))
                .y1((value) => y(value))
                .x((value, _index) => {
                    value = _index === 0 ? x(index) : x(index) + x.bandwidth();
                    result.x = value
                    xAxisLocations['x'+index] = value
                    return value;
                }).defined((value) => typeof value === 'number')([values[index], values[index]])
            return result;
        })
        return final;
    }

    calcExtent() {
        const { data, gridMin, gridMax, yAccessor } = this.props
        const values = data.map((obj) => yAccessor({ item: obj }))

        const extent = array.extent([...values, gridMax, gridMin])

        const { yMin = extent[0], yMax = extent[1] } = this.props

        return [yMin, yMax]
    }

    calcIndexes() {
        const { data } = this.props
        return data.map((_, index) => index)
    }

    render() {
        const { data, animate, animationDuration, disabled, style, numberOfTicks, svg, horizontal, children, onBarPress } = this.props

        const { height, width } = this.state

        if (data.length === 0) {
            return <View style={style} />
        }

        const extent = this.calcExtent()
        const indexes = this.calcIndexes()
        const ticks = array.ticks(extent[0], extent[1], numberOfTicks)

        const xDomain = horizontal ? extent : indexes
        const yDomain = horizontal ? indexes : extent

        const x = this.calcXScale(xDomain)
        const y = this.calcYScale(yDomain)

        const bandwidth = horizontal ? y.bandwidth() : x.bandwidth()

        const areas = this.calcAreas(x, y).filter(
            (area) => area.bar !== null && area.bar !== undefined && area.path !== null
        )
        const extraProps = {
            x,
            y,
            width,
            height,
            bandwidth,
            ticks,
            data,
        }

        return (
            <View style={style}>
                <View style={{ flex: 1 }} onLayout={(event) => this._onLayout(event)}>
                    {height > 0 && width > 0 && (
                        <Svg style={{ height, width }}>
                            {React.Children.map(children, (child) => {
                                if (child && child.props.belowChart) {
                                    return React.cloneElement(child, extraProps)
                                }
                            })}
                            {areas.map((area, index) => {
                                const {
                                    bar: { svg: barSvg = { } },
                                    path,
                                } = area

                                return (
                                    <TouchableWithoutFeedback disabled={disabled} onPress={() => { if (onBarPress) { onBarPress(index) } }}>
                                        <Path
                                            key={index}
                                            {...svg}
                                            {...barSvg}
                                            d={path}
                                            animate={animate}
                                            animationDuration={animationDuration}
                                        >
                                        </Path>
                                    </TouchableWithoutFeedback>

                                )
                            })}
                            {React.Children.map(children, (child) => {
                                if (child && !child.props.belowChart) {
                                    return React.cloneElement(child, extraProps)
                                }
                            })}
                        </Svg>
                    )}
                </View>
            </View>
        )
    }
}

BarChart.propTypes = {
    data: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.number, PropTypes.object])).isRequired,
    style: PropTypes.any,
    spacingInner: PropTypes.number,
    spacingOuter: PropTypes.number,
    animate: PropTypes.bool,
    animationDuration: PropTypes.number,
    contentInset: PropTypes.shape({
        top: PropTypes.number,
        left: PropTypes.number,
        right: PropTypes.number,
        bottom: PropTypes.number,
    }),
    numberOfTicks: PropTypes.number,
    gridMin: PropTypes.number,
    gridMax: PropTypes.number,
    svg: PropTypes.object,

    yMin: PropTypes.any,
    yMax: PropTypes.any,
    clamp: PropTypes.bool,
}

BarChart.defaultProps = {
    spacingInner: 0.05,
    spacingOuter: 0.05,
    contentInset: { },
    numberOfTicks: 10,
    svg: { },
    yAccessor: ({ item }) => item,
}

export default BarChart

import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { Text, View } from 'react-native'
import { Svg, G, Text as SVGText, Line } from 'react-native-svg'
// import * as d3Scale from 'd3-scale'
import * as d3Scale from '../node_modules/d3-scale';
import * as array from 'd3-array'
import { responsiveWidth } from 'react-native-responsive-dimensions';

class YAxis extends PureComponent {
    state = {
        height: 0,
        width: 0,
    }

    _onLayout(event) {
        const {
            nativeEvent: {
                layout: { height, width },
            },
        } = event
        this.setState({ height, width })
    }

    getY(domain) {
        const {
            scale,
            spacingInner,
            spacingOuter,
            contentInset: { top = 0, bottom = 0 },
        } = this.props

        const { height } = this.state

        const y = scale()
            .domain(domain)
            .range([height - bottom, top])

        if (scale === d3Scale.scaleBand) {
            console.log('hello scale scale band')
            // use index as domain identifier instead of value since
            // same value can occur at several places in dataPoints
            y
                // set range top to bottom - we are not sorting on values in scaleBand
                .range([top, height - bottom])
                .paddingInner([spacingInner])
                .paddingOuter([spacingOuter])

            //add half a bar to center label
            return (value) => y(value) + y.bandwidth() / 2
        }

        return y
    }

    render() {
        const { style, data, scale, yAccessor, labelX = '5%', ticksAreValues = false, lineProps = null, contentInset, numberOfTicks, formatLabel, svg, children } = this.props
        const { textOffset = 0 } = contentInset
        const { height, width } = this.state
        if (data.length === 0) {
            return <View style={style} />
        }

        const values = data.map((item, index) => yAccessor({ item, index }))
        const extent = array.extent(values)
        const { min = extent[0], max = extent[1] } = this.props
        const domain = scale === d3Scale.scaleBand ? values : [min, max]

        //invert range to support svg coordinate system
        const y = this.getY(domain)
        const ticks = (ticksAreValues || scale === d3Scale.scaleBand) ? values : y.nice().ticks(numberOfTicks)
        const longestValue = ticks
            .map((value, index) => formatLabel(value, index))
            .reduce((prev, curr) => (prev.toString().length > curr.toString().length ? prev : curr), 0)

        const extraProps = {
            y,
            ticks,
            width,
            height,
            formatLabel,
        }

        return (
            <View style={[style]}>
                <View style={{ flexGrow: 1, }} onLayout={(event) => this._onLayout(event)}>
                    {/*invisible text to allow for parent resizing*/}
                    <Text
                        style={{
                            opacity: 0,
                            fontSize: svg.fontSize,
                            fontFamily: svg.fontFamily,
                            fontWeight: svg.fontWeight,
                        }}
                    >
                        {longestValue}
                    </Text>
                    {height > 0 && width > 0 && (
                        <Svg
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                height: height + 30,
                                width: responsiveWidth(100),
                            }}
                        >
                            {lineProps && <Line x1={contentInset.left} x2={contentInset.left} y1={1} y2={height - 1} stroke={svg.fill || '#FFF'} strokeWidth={1} {...lineProps} />}
                            <G>
                                {React.Children.map(children, (child) => {
                                    return React.cloneElement(child, extraProps)
                                })}
                                {// don't render labels if width isn't measured yet,
                                    // causes rendering issues
                                    height > 0 &&
                                    ticks.map((value, index) => {
                                        return (<>
                                            <SVGText
                                                originY={y(value)}
                                                x={labelX}
                                                alignmentBaseline={'center'}
                                                fontSize={8}
                                                key={y(value)}
                                                textAnchor={'start'}
                                                y={y(value) + textOffset}
                                                {...svg}

                                            >

                                                {formatLabel(value, index, ticks.length)}
                                            </SVGText>
                                        </>
                                        )
                                    })}
                            </G>
                        </Svg>
                    )}
                </View>
            </View>
        )
    }
}

YAxis.propTypes = {
    data: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.object), PropTypes.arrayOf(PropTypes.number)]).isRequired,
    svg: PropTypes.object,
    style: PropTypes.any,
    numberOfTicks: PropTypes.number,
    formatLabel: PropTypes.func,
    contentInset: PropTypes.shape({
        top: PropTypes.number,
        bottom: PropTypes.number,
    }),
    min: PropTypes.number,
    max: PropTypes.number,
    yAccessor: PropTypes.func,
    scale: PropTypes.func,
    spacingInner: PropTypes.number,
    spacingOuter: PropTypes.number,
}

YAxis.defaultProps = {
    numberOfTicks: 10,
    spacingInner: 0.05,
    spacingOuter: 0.05,
    contentInset: {},
    svg: {},
    scale: d3Scale.scaleLinear,
    formatLabel: (value) => value && value.toString(),
    yAccessor: ({ item }) => item,
}

export default YAxis

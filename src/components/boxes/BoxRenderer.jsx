import TextBox from './TextBox'
import ImageBox from './ImageBox'
import VideoBox from './VideoBox'
import CodeBox from './CodeBox'
import OutputBox from './OutputBox'

const components = { text: TextBox, image: ImageBox, video: VideoBox, code: CodeBox, output: OutputBox }

export default function BoxRenderer(props) {
  const Component = components[props.box.type]
  return <Component {...props} />
}

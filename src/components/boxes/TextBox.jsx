import BaseBox from './BaseBox'
import RichTextEditor from './RichTextEditor'

export default function TextBox({ box, ...props }) {
  return <BaseBox box={box} {...props}><RichTextEditor value={box.content} onChange={props.onChange} /></BaseBox>
}

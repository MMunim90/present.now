import BaseBox from './BaseBox'
import CodeEditor from './CodeEditor'

export default function CodeBox({ box, ...props }) {
  return <BaseBox box={box} {...props}><CodeEditor value={box.content} language={box.metadata.language || 'JavaScript'} onChange={props.onChange} onLanguageChange={(language) => props.onChange(box.content, { language })} /></BaseBox>
}

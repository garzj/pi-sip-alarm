import { IntegerInput } from '@/input/IntegerInput';
import { audioSchemas, ProcessAudio } from '@shared/schema/alarm-process';
import { AlarmProcessInputs } from './AlarmProcessInput';

export const CallInputs: AlarmProcessInputs<'call' | 'callElse'> = ({
  item,
  onChange,
}) => {
  return (
    <>
      <br />
      <br />
      <label>Phone</label>
      <input
        type='text'
        value={item.phone}
        onChange={(e) => {
          const newItem = Object.assign({}, item);
          newItem.phone = e.target.value;
          onChange(newItem);
        }}
      />

      <br />
      <br />
      <label>Audio</label>
      <div className='process-section'>
        {/* Audio type selection */}
        <label>Type</label>
        <select
          value={item.audio.type}
          onChange={(e) => {
            const audioType = e.target.value as ProcessAudio['type'];
            const newItem = Object.assign({}, item);
            newItem.audio = audioSchemas[audioType].parse({ type: audioType });
            onChange(newItem);
          }}
        >
          {Object.keys(audioSchemas).map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <br />
        <br />
        {item.audio.type === 'text' ? (
          <>
            <label>Text</label>
            <textarea
              value={item.audio.text}
              onChange={(e) => {
                const newItem = {
                  ...item,
                  audio: { ...item.audio, text: e.target.value },
                };
                onChange(newItem);
              }}
            />
          </>
        ) : (
          <>
            <label>File</label>
            <input
              type='text'
              value={item.audio.file}
              onChange={(e) => {
                const newItem = {
                  ...item,
                  audio: { ...item.audio, file: e.target.value },
                };
                onChange(newItem);
              }}
            />
          </>
        )}

        <br />
        <br />
        <label>Play times</label>
        <IntegerInput
          value={item.audio.playTimes}
          onChange={(val) => {
            const newItem = {
              ...item,
              audio: { ...item.audio, playTimes: val },
            };
            onChange(newItem);
          }}
        />
      </div>
    </>
  );
};

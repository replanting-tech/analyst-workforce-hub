import { useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';
// import './App.css';

export default function App() {
  const editorRef = useRef(null);
if (editorRef.current) {
    }
    const initialValue = `<table style="border-collapse: collapse; width: 100%; max-width: 100%; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333;">
  <tbody>
    <tr>
      <td style="border: 1px solid #ccc; padding: 8px; font-weight: bold;">Ticket ID</td>
      <td style="border: 1px solid #ccc; padding: 8px;">CSOC-18254</td>
    </tr>
    <tr>
      <td style="border: 1px solid #ccc; padding: 8px; font-weight: bold;">Ticket Name</td>
      <td style="border: 1px solid #ccc; padding: 8px;">DEEP INSTINCT/Dual_use_investigation_tool/High/10.10.11.80/Detected</td>
    </tr>
    <tr>
      <td style="border: 1px solid #ccc; padding: 8px; font-weight: bold;">Log Source</td>
      <td style="border: 1px solid #ccc; padding: 8px;">Deep Instinct</td>
    </tr>
    <tr>
      <td style="border: 1px solid #ccc; padding: 8px; font-weight: bold;">Alert Date</td>
      <td style="border: 1px solid #ccc; padding: 8px;">2025-06-13T05:08:30.8509285Z</td>
    </tr>
    <tr>
      <td style="border: 1px solid #ccc; padding: 8px; font-weight: bold;">Incident Severity</td>
      <td style="border: 1px solid #ccc; padding: 8px;">MEDIUM</td>
    </tr>
    <tr>
      <td style="border: 1px solid #ccc; padding: 8px; font-weight: bold;">Entity</td>
      <td style="border: 1px solid #ccc; padding: 8px;">
        Source IP: 10.10.11.80<br />
        Asset Hostname: GWO8UCDL525001<br />
        Username: COMPNET\\pieter
      </td>
    </tr>
    <tr>
      <td style="border: 1px solid #ccc; padding: 8px; font-weight: bold;">Description</td>
      <td style="border: 1px solid #ccc; padding: 8px;">
        Threat Category: No. threat category found<br /><br />
        The file <strong>ncat.exe</strong> is a network utility commonly associated with the Nmap suite, which has been identified as potentially malicious. It is often exploited by threat actors for activities such as data exfiltration, establishing reverse shells, and facilitating command-and-control operations. The involvement of a reputable security vendor like CrowdStrike highlights the need for caution and further investigation.
        <br /><br />
        {{incident_additional_info}}
      </td>
    </tr>
    <tr>
      <td style="border: 1px solid #ccc; padding: 8px; font-weight: bold;">Threat Indicators</td>
      <td style="border: 1px solid #ccc; padding: 8px;">
        <strong>Filehash analysis:</strong> ncat.exe has been flagged as malicious by 2 out of 72 security vendors, indicating a potential risk despite its legitimate use within the Nmap suite. This discrepancy in detection rates suggests that while the file may be benign, its presence should be carefully scrutinized due to its known abuse in cyber threats.
      </td>
    </tr>
    <tr>
      <td style="border: 1px solid #ccc; padding: 8px; font-weight: bold;">Technical Recommendation</td>
      <td style="border: 1px solid #ccc; padding: 8px;">
        Delete the file if its installation was not intentional or cannot be verified. Only download ncat.exe from official sources, such as nmap.org, and conduct a full antivirus/malware scan using trusted security solutions. Additionally, verify the file's location; if found in unusual directories like Downloads or Temp, treat it with heightened caution.
      </td>
    </tr>
  </tbody>
</table>
`;

  return (
    <>
      <Editor
        apiKey='9pxbmembo1uetj3qto7w4t0ce6vi14e321zvnvyip544v0yi'
        onInit={ (_evt, editor) => editorRef.current = editor }
        initialValue={initialValue}
        init={{
          height: 500,
          menubar: false,
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
          ],
          toolbar: 'undo redo | blocks | ' +
            'bold italic forecolor | alignleft aligncenter ' +
            'alignright alignjustify | bullist numlist outdent indent | ' +
            'removeformat | help',
          content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
        }}
      />
    </>
  );
}
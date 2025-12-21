export default function DeliveryTimeline({ events }) {
  if (!events || events.length === 0) {
    return <div>배송 정보가 없습니다.</div>;
  }

  return (
    <div style={{ marginTop: "20px" }}>
      <h4>배송 진행 단계</h4>
      {events.map((e, idx) => (
        <div key={idx} style={{ marginBottom: "10px" }}>
          <strong>[{e.status}]</strong>
          <div>{e.time}</div>
          <div>{e.location}</div>
          <hr />
        </div>
      ))}
    </div>
  );
}

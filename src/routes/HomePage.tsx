export default function HomePage() {
  return (
    <section className="page-section">
      <div className="intro">
        <p className="eyebrow">少人数向けの予定調整</p>
        <h1>日付範囲を選んで、授業時間と夜間の都合を集めます。</h1>
        <p>
          アカウントなしで予定表を作成し、公開 URL を共有できます。回答は参加者ごとにまとめて保存されます。
        </p>
        <a className="button button-primary" href="/new">
          予定調整を作成
        </a>
      </div>
    </section>
  );
}

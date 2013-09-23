#include "n_exec_widget.h"
#include "ui_n_exec_widget.h"
#include <QScreen>
#include <QCursor>
#include <QWebInspector>

NExecWidget::NExecWidget(QWidget *parent) : QMainWindow(parent), ui(new Ui::NExecWidget)
{
    ui->setupUi(this);

    resize(QGuiApplication::primaryScreen()->availableSize());
    ui->menubar->hide();
    ui->statusbar->hide();

    QWebView *webView = ui->webView;
    QWebSettings *settings = webView->settings();
    QWebSettings::setObjectCacheCapacities(0, 0, 0);
    settings->setAttribute(QWebSettings::LocalContentCanAccessRemoteUrls, true);
    settings->setAttribute(QWebSettings::DeveloperExtrasEnabled, true);

    connect(ui->webView, SIGNAL(loadFinished(bool)), this, SIGNAL(finishLoad()));
    connect(ui->webView, SIGNAL(customContextMenuRequested(QPoint)), this, SLOT(contextMenuForWebView(QPoint)));
}

void NExecWidget::loadFile(const QString &filePath) {
    QWebView *webView = ui->webView;
    QString htmlPath = "file://" + filePath;
    mUrl = QUrl(htmlPath);
    webView->load(mUrl);
}

void NExecWidget::reload() {
    QWebView *webView = ui->webView;
    webView->load(mUrl);
}

void NExecWidget::showInspector() {
    QWebPage *page = ui->webView->page();
    QWebInspector *inspector = new QWebInspector;
    inspector->setPage(page);
    inspector->show();
}

void NExecWidget::contextMenuForWebView(const QPoint &/*point*/) {
    QMenu menu(this);
    menu.addAction(tr("&Reload"), this, SLOT(reload()));
    menu.addAction(tr("&Inspector"), this, SLOT(showInspector()));
    menu.exec(QCursor::pos());
}

NExecWidget::~NExecWidget()
{
    delete ui;
}

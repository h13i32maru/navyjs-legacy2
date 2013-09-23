#include "n_exec_widget.h"
#include "ui_n_exec_widget.h"
#include <QScreen>
#include <QCursor>
#include <QWebInspector>
#include <QWebFrame>
#include <QDebug>
#include <QWebPage>

NExecWidget::NExecWidget(QWidget *parent) : QMainWindow(parent), ui(new Ui::NExecWidget)
{
    ui->setupUi(this);

    resize(QGuiApplication::primaryScreen()->availableSize());
    ui->menubar->hide();
    ui->statusbar->hide();

    mInspector = new QWebInspector();

    QWebPage *page = ui->webView->page();
    QVBoxLayout *layout = new QVBoxLayout;
    layout->addWidget(mInspector);
    layout->setMargin(0);
    ui->inspector->setLayout(layout);
    mInspector->setPage(page);
    mInspector->show();

    QWebView *webView = ui->webView;
    QWebSettings *settings = webView->settings();
    QWebSettings::setObjectCacheCapacities(0, 0, 0);
    settings->setAttribute(QWebSettings::LocalContentCanAccessRemoteUrls, true);
    settings->setAttribute(QWebSettings::DeveloperExtrasEnabled, true);

    // 本来はブリッジは必要ないのだが、JS側にNavyCreatorから実行されていることを知らせるためにあえてブリッジを入れている
    mNative = new NativeBridge(this);
    webView->page()->mainFrame()->addToJavaScriptWindowObject(QString("Native"), mNative);

    connect(webView->page()->mainFrame(), SIGNAL(javaScriptWindowObjectCleared()), this, SLOT(injectNativeBridge()));
    connect(ui->webView, SIGNAL(loadFinished(bool)), this, SIGNAL(finishLoad()));
    connect(ui->webView, SIGNAL(customContextMenuRequested(QPoint)), this, SLOT(contextMenuForWebView(QPoint)));
}

void NExecWidget::injectNativeBridge() {
    QWebView *webView = ui->webView;
    webView->page()->mainFrame()->addToJavaScriptWindowObject(QString("Native"), mNative);
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

void NExecWidget::contextMenuForWebView(const QPoint &/*point*/) {
    QMenu menu(this);
    menu.addAction(tr("&Reload"), this, SLOT(reload()));
    menu.exec(QCursor::pos());
}

NExecWidget::~NExecWidget()
{
    delete ui;
}

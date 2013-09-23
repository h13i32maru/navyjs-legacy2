#include "n_exec_widget.h"
#include "ui_n_exec_widget.h"
#include <QScreen>

NExecWidget::NExecWidget(QWidget *parent) : QMainWindow(parent), ui(new Ui::NExecWidget)
{
    ui->setupUi(this);

    resize(QGuiApplication::primaryScreen()->availableSize());
    ui->menubar->hide();
    ui->statusbar->hide();

    connect(ui->webView, SIGNAL(loadFinished(bool)), this, SIGNAL(finishLoad()));
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

NExecWidget::~NExecWidget()
{
    delete ui;
}

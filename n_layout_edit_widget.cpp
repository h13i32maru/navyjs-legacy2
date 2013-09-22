#include "n_layout_edit_widget.h"
#include "ui_n_layout_edit_widget.h"

#include <QWebFrame>

NLayoutEditWidget::NLayoutEditWidget(QWidget *parent) : QWidget(parent), ui(new Ui::NLayoutEditWidget)
{
    ui->setupUi(this);

    QWebView *webView = ui->webView;
    QWebSettings *settings = webView->settings();
    settings->setAttribute(QWebSettings::LocalContentCanAccessRemoteUrls, true);
    settings->setAttribute(QWebSettings::DeveloperExtrasEnabled, true);
}

void NLayoutEditWidget::setNativeBridge(NativeBridge *native) {
    mNative = native;
    QWebView *webView = ui->webView;
    connect(webView->page()->mainFrame(), SIGNAL(javaScriptWindowObjectCleared()), this, SLOT(injectNativeBridge()));
    injectNativeBridge();
}

void NLayoutEditWidget::loadFile(QString filePath) {
    QWebView *webView = ui->webView;
    QString htmlPath = "file://" + filePath;
    webView->load(QUrl(htmlPath));
}

void NLayoutEditWidget::injectNativeBridge (){
    QWebView *webView = ui->webView;
    webView->page()->mainFrame()->addToJavaScriptWindowObject(QString("Native"), mNative);
}

NLayoutEditWidget::~NLayoutEditWidget()
{
    delete ui;
}

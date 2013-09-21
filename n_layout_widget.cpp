#include "n_layout_widget.h"
#include "native_bridge.h"
#include "ui_n_layout_widget.h"

#include <QWebView>
#include <QWebFrame>

NLayoutWidget::NLayoutWidget(QWidget *parent) : NFileTabEditor(parent), ui(new Ui::NLayoutWidget)
{
    ui->setupUi(this);

    mRootDirName = "layout";
    mFileExtension = "json";
    mImportFileExtension = "Text (*.json)";
    mContextNewFileLabel = tr("&JSON");

    init(ui->fileTreeView, ui->fileTabWidget, ui->tabBackgroundWidget);
}

QWidget *NLayoutWidget::createTabWidget(const QString &filePath) {
    QWebView *webView = new QWebView();

    QWebSettings *settings = webView->settings();
    settings->setAttribute(QWebSettings::LocalContentCanAccessRemoteUrls, true);
    settings->setAttribute(QWebSettings::DeveloperExtrasEnabled, true);

    //connect(webView->page()->mainFrame(), SIGNAL(javaScriptWindowObjectCleared()), this, SLOT(addJSObject()));
    NativeBridge *native = new NativeBridge(this);
    QString layoutPath = QString(filePath).remove(0, mProjectDir->absolutePath().length() + 1);
    native->setLayoutPath(layoutPath);
    webView->page()->mainFrame()->addToJavaScriptWindowObject(QString("Native"), native);

    QString htmlPath = "file://" + mProjectDir->absoluteFilePath("index.html");
    webView->load(QUrl(htmlPath));
    return webView;
}

QString NLayoutWidget::editedFileContent(QWidget* /* widget */) {
    return NULL;
}


NLayoutWidget::~NLayoutWidget()
{
    delete ui;
}

#include "n_layout_edit_widget.h"
#include "n_util.h"
#include "ui_n_layout_edit_widget.h"

#include <QWebFrame>
#include <QDebug>

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

    connect(native, SIGNAL(changedLayers(QList<QMap<QString,QString> >)), this, SLOT(setLayers(QList<QMap<QString,QString> >)));
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

void NLayoutEditWidget::setLayers(const QList<QMap<QString, QString> > &layers) {
    QTreeWidget *layerTreeWidget = ui->layerTreeWidget;
    for (int i = 0; i < layers.length(); i++) {
        QStringList row;
        NUtil::expand(row, 4);
        row[LayerColId] = layers[i]["id"];
        row[LayerColClass] = layers[i]["class"];
        row[LayerColPos] = layers[i]["x"] + ", " + layers[i]["y"];
        row[LayerColSize] = layers[i]["width"] + " x " + layers[i]["height"];

        QTreeWidgetItem *item = new QTreeWidgetItem(row);
        item->setFlags(Qt::ItemIsDragEnabled | Qt::ItemIsEnabled | Qt::ItemIsSelectable | Qt::ItemNeverHasChildren);

        layerTreeWidget->addTopLevelItem(item);
    }
    qDebug() << layers;
}

NLayoutEditWidget::~NLayoutEditWidget()
{
    delete ui;
}

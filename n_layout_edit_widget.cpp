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

    connect(ui->layerTreeWidget, SIGNAL(changedTreeByDrop()), this, SLOT(updateViewsToJS()));
    connect(ui->layerTreeWidget, SIGNAL(itemSelectionChanged()), this, SLOT(selectViewToJS()));
}

void NLayoutEditWidget::setNativeBridge(NativeBridge *native) {
    mNative = native;
    QWebView *webView = ui->webView;
    connect(webView->page()->mainFrame(), SIGNAL(javaScriptWindowObjectCleared()), this, SLOT(injectNativeBridge()));
    injectNativeBridge();

    ui->layoutPropEdit->setNativeBridge(native);

    connect(native, SIGNAL(viewsFromJS(QList<QMap<QString,QString> >)), this, SLOT(setViews(QList<QMap<QString,QString> >)));
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

void NLayoutEditWidget::setViews(const QList<QMap<QString, QString> > &views) {
    QTreeWidget *layerTreeWidget = ui->layerTreeWidget;
    for (int i = 0; i < views.length(); i++) {
        QStringList row;
        NUtil::expand(row, 4);
        row[ViewsColId] = views[i]["id"];
        row[ViewsColClass] = views[i]["class"];
        row[ViewsColPos] = views[i]["x"] + ", " + views[i]["y"];
        row[ViewsColSize] = views[i]["width"] + " x " + views[i]["height"];

        QTreeWidgetItem *item = new QTreeWidgetItem(row);
        item->setFlags(Qt::ItemIsDragEnabled | Qt::ItemIsEnabled | Qt::ItemIsSelectable | Qt::ItemNeverHasChildren);

        layerTreeWidget->addTopLevelItem(item);
    }
}

void NLayoutEditWidget::updateViewsToJS() {
    NTreeWidget *tree = ui->layerTreeWidget;
    int layerNum = tree->topLevelItemCount();
    QStringList viewIds;
    for (int i = 0; i < layerNum; i++) {
        viewIds.append(tree->topLevelItem(i)->text(ViewsColId));
    }
    emit mNative->changedViewsOrderToJS(viewIds);
}

void NLayoutEditWidget::selectViewToJS() {
    NTreeWidget *tree = ui->layerTreeWidget;
    QString viewId = tree->currentItem()->text(ViewsColId);
    emit mNative->changedSelectedViewToJS(viewId);
}

NLayoutEditWidget::~NLayoutEditWidget()
{
    delete ui;
}

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
    QWebSettings::setObjectCacheCapacities(0, 0, 0);
    settings->setAttribute(QWebSettings::LocalContentCanAccessRemoteUrls, true);
    settings->setAttribute(QWebSettings::DeveloperExtrasEnabled, true);

    connect(ui->viewClassTreeWidget, SIGNAL(itemDoubleClicked(QTreeWidgetItem*,int)), this, SLOT(addViewToJS(QTreeWidgetItem*, int)));
    connect(ui->layerTreeWidget, SIGNAL(changedTreeByDrop()), this, SLOT(updateViewsToJS()));
    connect(ui->layerTreeWidget, SIGNAL(itemSelectionChanged()), this, SLOT(selectViewToJS()));
}

void NLayoutEditWidget::setNativeBridge(NativeBridge *native) {
    mNative = native;
    QWebView *webView = ui->webView;
    connect(webView->page()->mainFrame(), SIGNAL(javaScriptWindowObjectCleared()), this, SLOT(injectNativeBridge()));
    injectNativeBridge();

    ui->layoutPropEdit->setNativeBridge(native);

    connect(native, SIGNAL(viewsFromJS(QList<QMap<QString,QString> >)), this, SLOT(setViewsFromJS(QList<QMap<QString,QString> >)));
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

void NLayoutEditWidget::setViewsFromJS(const QList<QMap<QString, QString> > &views) {
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

/*************************************************
 * to js method
 *************************************************/
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

void NLayoutEditWidget::addViewToJS(QTreeWidgetItem *item, int /* index */) {
    QTreeWidget *tree = ui->viewClassTreeWidget;
    QString viewId = item->text(ViewClassColName) + QString::number(tree->topLevelItemCount());
    QString viewClass = item->text(ViewClassColClass);

    emit mNative->addViewToJS(viewId, viewClass);
}

NLayoutEditWidget::~NLayoutEditWidget()
{
    delete ui;
}

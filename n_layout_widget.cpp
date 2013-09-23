#include "n_layout_widget.h"
#include "native_bridge.h"
#include "ui_n_layout_widget.h"
#include "n_layout_edit_widget.h"

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
    NLayoutEditWidget *widget = new NLayoutEditWidget(this);

    NativeBridge *native = new NativeBridge(this);
    QString layoutPath = QString(filePath).remove(0, mProjectDir->absolutePath().length() + 1);
    native->setLayoutPath(layoutPath);

    widget->setNativeBridge(native);
    widget->loadFile(mProjectDir->absoluteFilePath("index.html"));

    connect(native, SIGNAL(changedLayoutContent()), this, SLOT(updateTabForCurrentFileContentChanged()));

    return widget;
}

QString NLayoutWidget::editedFileContent(QWidget* widget) {
    NLayoutEditWidget *layoutEditWidget = (NLayoutEditWidget *) widget;
    QString contentLayoutJsonText = layoutEditWidget->contentLayoutJsonText();
    return contentLayoutJsonText;
}


NLayoutWidget::~NLayoutWidget()
{
    delete ui;
}

#include "edit_json_dialog.h"
#include "n_config_app_widget.h"
#include "ui_n_config_app_widget.h"

#include <QMenu>

NConfigAppWidget::NConfigAppWidget(const QDir &projectDir, const QString &filePath, QWidget *parent) : NFileWidget(projectDir, filePath, parent), ui(new Ui::NConfigAppWidget)
{
    ui->setupUi(this);

    mConfigApp.parseFromFilePath(filePath);

    syncJsonToWidget();

    connect(this, SIGNAL(customContextMenuRequested(QPoint)), this, SLOT(contextMenu(QPoint)));
    connect(ui->appSizeWidth, SIGNAL(valueChanged(int)), this, SLOT(changed()));
    connect(ui->appSizeHeight, SIGNAL(valueChanged(int)), this, SLOT(changed()));
    connect(ui->appStartScene, SIGNAL(textChanged(QString)), this, SLOT(changed()));
}

bool NConfigAppWidget::save() {
    syncWidgetToJson();

    QFile configAppFile(mFilePath);
    if (!configAppFile.open(QIODevice::WriteOnly | QIODevice::Text)) {
        return false;
    }

    int ret = configAppFile.write(this->mConfigApp.stringify());

    return (ret == -1 ? false : true);
}

void NConfigAppWidget::syncJsonToWidget() {
    ui->appSizeWidth->setValue(mConfigApp.getInt("size.width"));
    ui->appSizeHeight->setValue(mConfigApp.getInt("size.height"));
    ui->appStartScene->setText(mConfigApp.getStr("start.scene"));
}

void NConfigAppWidget::syncWidgetToJson() {
    mConfigApp.set("size.width", ui->appSizeWidth->value());
    mConfigApp.set("size.height", ui->appSizeHeight->value());
    mConfigApp.set("start.scene", ui->appStartScene->text());
}

void NConfigAppWidget::contextMenu(QPoint /*point*/) {
    QMenu menu(this);
    menu.addSeparator();
    menu.addAction(tr("&Raw Data"), this, SLOT(showRawData()));
    menu.exec(QCursor::pos());
}

void NConfigAppWidget::showRawData() {
    EditJsonDialog dialog(this);
    this->syncWidgetToJson();
    dialog.setJsonText(mConfigApp.stringify());
    dialog.exec();
}

NConfigAppWidget::~NConfigAppWidget()
{
    delete ui;
}
